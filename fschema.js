const $ = {}

export function deep_equal ( a, b ) {
	let ka, kb, oa, ob ;
	if ( a === b || ( Number.isNaN( a ) && Number.isNaN( b ) ) )
		return a === b
	oa = typeof a === 'object' && a !== null
	ob = typeof b === 'object' && b !== null
	if ( oa !== ob ) return false
	if ( !oa ) return false
	ka = Object.keys( a )
	kb = Object.keys( b )
	if ( ka.length !== kb.length ) return false
	for ( let k of ka ) {
		if ( !( k in b ) )
			return false
		if ( !deep_equal( a[ k ], b[ k ] ) )
			return false
	}
	return true
}

export function Violation ( spec ) {
	if ( typeof spec !== 'object' )
		throw new Error( "invalid violation specification" )
	if ( !( 'value' in spec ) )
		throw new Error( "violation specification missing value" )
	const { value, name, code, args = [] } = spec
	if ( typeof name !== 'string' || !name.length )
		throw new Error( "violation value name must be a non-empty string" )
	if ( typeof name !== 'string' || !code.length )
		throw new Error( "violation code must be a non-empty string" )
	if ( !( args instanceof Array ) )
		throw new Error( "violation arguments must be an Array" )
	Object.assign( this, { value, name, code, args } )
}

$.nam ??= Symbol( 'nam' )
$.val ??= Symbol( 'val' )
$.vio ??= Symbol( 'vio' )
$.add ??= Symbol( 'add' )

export function Validation ( value, name ) {
	this[$.val] = value
	this[$.nam] = name
}

Validation.prototype = {
	[$.vio] : [],
	[$.add] : function ( ...args ) {
		if ( !args.length )
			throw new Error( "invalid add()" )
		if ( typeof args[ 0 ] === 'string' ) {
			( this[$.vio] ??= [] ).push( new Violation({
				value : this.value(),
				name : this.name(),
				code : args[ 0 ],
				args : args.slice( 1 ) } ) )
		} else if ( a instanceof Validation ) {
			this[$.vio] = ( this[$.vio] ?? [] ).concat( args[ 0 ][$.vio] )
			throw new Error( "unknown add()" )
		}
		return this
	},
	value : function () { return this[$.val] },
	name : function () { return this[$.nam] },
	present : function () { return this[$.val] != null },
	ok : function () { return this[$.vio].length },
	list : function ( strings ) {
		return this[$.vio].map( _ => ({ ..._ }) )},
	messages : function ( strings ) {
		return this.list( strings ).map( _ => _.message )},
	as_error : function ( strings ) {
		const msgs = this.messages( strings )
		return msgs.length ? new Error( msgs[ 0 ] ) : null
	}
}

$.nam ??= Symbol( 'nam' )

export function FVal () {}

FVal.prototype = {
	[$.nam] : "value",
	clone : function ( props ) {
		const clone = Object.create( Object.getPrototypeOf( this ) )
		return Object.assign( clone, this, props )
	},
	name : function ( name ) {
		if ( typeof name !== 'string' )
			throw new Error( "invalid schema name" )
		this[$.nam] = name
		return this
	},
	accepts : function ( val ) { return this.validate( val ).ok() },
	rejects : function ( val ) { return !this.accepts( val )},
	assert : function ( strings ) {
		const result = this.validate( value )
		if ( result.ok() ) return this
		throw result.as_error()
	},
	references : function ( that ) {
		return that === this
	},
	validate : function ( val, name ) {
		return new Validation( val, name || this[$.nam] )
	}
}

export function FNone () {
	if ( arguments.length )
		throw new Error( "none() accepts no arguments" )
	FNone.parent.call( this )
}

FNone.parent = FVal
FNone.prototype = Object.assign( Object.create( FVal.prototype ), {
	constructor : FNone,
	validate : function ( ...args ) {
		const result = FNone.parent.validate.call( this, ...args )
		result[$.add]( 'none' )
		return result
	}
} )

export function FVoid () {
	if ( arguments.length )
		throw new Error( "void() accepts no arguments" )
	FVoid.parent.call( this )
}

FVoid.parent = FVal
FVoid.prototype = Object.assign( Object.create( FVal.prototype ), {
	constructor : FVoid,
	validate : function ( ...args ) {
		const result = FVoid.parent.prototype.validate.call( this, ...args )
		if ( result.present() )
			result[$.add]( 'void' )
		return result
	}
} )

$.opt ??= Symbol( 'opt' )

export function FAny () {
	if ( arguments.length )
		throw new Error( "any() accepts no arguments" )
	FAny.parent.call( this )
}

FAny.parent = FVal
FAny.prototype = Object.assign( Object.create( FVal.prototype ), {
	constructor : FAny,
	optional : function ( yn = true ) {
		if ( arguments.length > 1 || typeof yn !== 'boolean' )
			throw new Error( "optional() accepts a boolean" )
		return this.clone({ [$.opt] : yn })
	},
	validate : function ( ...args ) {
		const result = FAny.parent.prototype.validate.call( this, ...args )
		if ( !this[$.opt] && !result.present() )
			result.add( $.vio, 'any.req' )
		return result
	}
} )

export function FBoolean () {
	if ( arguments.length )
		throw new Error( "boolean() accepts no arguments" )
	FBoolean.parent.call( this )
}

FBoolean.parent = FAny
FBoolean.prototype = Object.assign( Object.create( FAny.prototype ), {
	constructor : FBoolean,
	validate : function ( ...args ) {
		const result = FBoolean.parent.prototype.validate.call( this, ...args )
		if ( result.present() && typeof result.value !== 'boolean' )
			result.add( $.vio, 'bln' )
		return result
	}
} )

$.min ??= Symbol( 'min' )
$.max ??= Symbol( 'max' )
$.xlo ??= Symbol( 'xlo' )
$.xhi ??= Symbol( 'xhi' )

const INumeric = ( {
	parent, default_min, default_max, typecheck, prefix
} ) => {
	function INumeric ( ...args ) {
		parent.call( this, ...args )
	}

	INumeric.prototype = Object.assign( Object.create( parent ?? null ), {
		[$.min] : default_min,
		[$.max] : default_max,
		range : function ( min, max, xlo, xhi ) {
			if ( !typecheck( min ) || !typecheck( max ) )
				throw new Error( `range() bounds must be type ${this.type()}` )
			xlo ??= null ; xhi ??= null
			if ( xlo !== null && typeof xlo !== 'boolean' )
				throw new Error( "lower number clusivity must be boolean" )
			if ( max < min )
				throw new Error( `${this.type()} bounds inverted` )
			return this.clone({
				[$.min] : min, [$.max] : max, [$.xlo] : xlo, [$.xhi] : xhi })
		},
		gte : function ( n ) {
			if ( arguments.length !== 1 || !typecheck( n ) )
				throw new Error( `gte() accepts one ${this.type()}`)
			return this.range( n, this[$.max], false, this[$.xlo ] )
		},
		lte : function ( n ) {
			if ( arguments.length !== 1 || !typecheck( n ) )
				throw new Error( `lte() accepts one ${this.type()}`)
			return this.range( this[$.min], n, this[$.xhi], false )
		},
		gt : function ( n ) {
			if ( arguments.length !== 1 || !typecheck( n ) )
				throw new Error( `gt() accepts one ${this.type()}`)
			return this.range( n, this[$.max], true, this[$.xlo] )
		},
		lt : function ( n ) {
			if ( arguments.length !== 1 || !typecheck( n ) )
				throw new Error( `lt() accepts one ${this.type()}`)
			return this.range( this[$.min], n, this[$.xhi], true )
		},
		validate : function ( ...args ) {
			const result = parent.prototype.validate.call( this, ...args )
			const value = result.value()
			if ( !result.present() )
				return result
			if ( !typecheck( value ) )
				return result[$.add]( prefix )
			if ( this[$.min] !== null && !this[$.xlo] && value < this[$.min] )
				return result[$.add]( `${prefix}.min` )
			if ( this[$.min] !== null && this[$.xlo] && value <= this[$.min] )
				return result[$.add]( `${prefix}.xmin` )
			if ( this[$.max] !== null && !this[$.xhi] && value < this[$.max] )
				return result[$.add]( `${prefix}.max` )
			if ( this[$.max] !== null && this[$.xhi] && value <= this[$.max] )
				return result[$.add]( `${prefix}.xmax` )
			return result
		}
	} )

	return INumeric
}

$.fin ??= Symbol( 'fin' )

export function FNumber () {
	if ( arguments.length )
		throw new Error( "number() accepts no arguments" )
	FNumber.parent.call( this, ...args )
}

FNumber.parent = INumeric({
	parent      : FAny,
	default_min : -Infinity,
	default_max : Infinity,
	typecheck   : typeof _ === 'number',
	prefix      : 'num'
})

FNumber.prototype = Object.assign( Object.create( FNumber.parent ), {
	constructor : FNumber,
	finite : function ( yn = true ) {
		if ( arguments.length > 1 || typeof yn !== 'boolean' )
			throw new Error( "finite() accepts a boolean" )
		return this.clone( { [$.fin] : yn } )
	},
	validate : function ( ...args ) {
		const result = FNumber.parent.prototype.validate.call( this, ...args )
		const value = result.value()
		if ( !result.present() || !result.ok() )
			return result
		if ( this[$.fin] && !Number.isFinite( value ) )
			result[$.add]( 'num.fin' )
		return result
	}
} )

export function FInteger () {
	if ( arguments.length )
		throw new Error( "integer() accepts no arguments" )
	FInteger.parent.call( this, ...args )
}

FInteger.parent = INumeric({
	parent      : FAny,
	default_min : Number.MIN_SAFE_INTEGER,
	default_max : Number.MAX_SAFE_INTEGER,
	typecheck   : Number.isSafeInteger,
	prefix      : 'int'
})

FInteger.prototype = Object.assign( Object.create( FInteger.parent ), {
	constructor : FInteger
} )

export function FBigInt () {
	if ( arguments.length )
		throw new Error( "bigint() accepts no arguments" )
	FBigInt.parent.call( this, ...args )
}

FBigInt.parent = INumeric({
	parent      : FAny,
	default_min : null,
	default_max : null,
	typecheck   : _ => typeof _ === 'bigint',
	prefix      : 'big'
})

FBigInt.prototype = Object.assign( Object.create( FBigInt.parent ), {
	constructor : FBigInt
} )

$.min ??= Symbol( 'min' )
$.max ??= Symbol( 'max' )

const ILength = ( {
	base, typecheck, prefix
} ) => {
	function ILength ( ...args ) {
		base.call( this, ...args )
	}

	ILength.prototype = Object.assign( Object.create( base.prototype ), {
		[$.min] : 0,
		[$.max] : Number.MAX_SAFE_INTEGER,
		length : function ( a, b ) {
			if ( arguments.length !== 1 && arguments.length !== 2 )
				throw new Error( "length() accepts one or two integers" )
			b ??= a
			if ( !Number.isSafeInteger( a ) || !Number.isSafeInteger( b ) )
				throw new Error( "length() bounds must be integers" )
			if ( b < a )
				throw new Error( "length() bounds inverted" )
			return this.clone({ [$.min] : a, [$.max] : b })
		},
		validate : function ( ...args ) {
			const result = base.prototype.validate.call( this, ...args )
			const value = result.value()
			if ( !result.present() )
				return result
			if ( !typecheck( value ) )
				return result[$.add]( prefix )
			if ( !value.length )
				return result[$.add]( `${prefix}.len` )
			if ( this[$.min] === null )
				return result
			if ( this[$.min] === this[$.max] && value.length !== this[$.min] )
				return result[$.add]( `${prefix}.len.eq`, this[$.min] )
			if ( value.length < this[$.min] )
				return result[$.add]( `${prefix}.len.min`, this[$.min] )
			if ( value.length > this[$.max] )
				return result[$.add]( `${prefix}.len.max`, this[$.max] )
			return result
		}
	} )

	return ILength
}

$.pat ??= Symbol( 'pat' )

export function FString () {
	if ( arguments.length )
		throw new Error( "string() accepts no arguments" )
	FString.parent.call( this, ...args )
}

FString.parent = ILength({
	base      : FAny,
	typecheck : _ => typeof _ === 'string',
	prefix    : 'str'
})

FString.prototype = Object.assign( Object.create( FString.parent.prototype ), {
	constructor : FString,
	[$.pat] : null,
	pattern : function ( pattern ) {
		if ( arguments.length !== 1 )
			throw new Error( "pattern() accepts a RegExp" )
		if ( typeof pattern === 'string' ) {
			try {
				pattern = new RegExp( pattern )
			} catch {
				throw new Error( "invalid pattern()" )
			}
		}
		if ( !( pattern instanceof RegExp ) )
			throw new Error( "invalid pattern()" )
		return this.clone( { [$.pat] : pattern } )
	},
	validate : function ( ...args ) {
		const result = FString.parent.prototype.validate.call( this, ...args )
		if ( !result.present() || !result.ok() )
			return result
		if ( this[$.pat] && !result.value.match( result ) )
			result[$.add]( 'str.pat', this[$.pat] )
		return result
	}
} )

$.ofi ??= Symbol( 'ofi' )

export function FArray ( ...args ) {
	if ( arguments.length === 1 )
		return ( new FArray ).of( ...args )
	if ( arguments.length )
		throw new Error( "array() accepts an optional item schema" )
	FArray.parent.call( this )
}

FArray.parent = ILength({
	base      : FAny,
	typecheck : _ => _ instanceof Array,
	prefix    : 'arr'
})

FArray.prototype = Object.assign( Object.create( FArray.parent.prototype ), {
	[$.ofi] : null,
	of : function ( item ) {
		if ( !( item instanceof FVal ) )
			throw new Error( "invalid of() schema" )
		if ( item.references( this ) )
			throw new Error( "of() schema cycles" )
		return this.clone( { [$.ofi] : item } )
	},
	validate : function ( ...args ) {
		const result = FArray.parent.prototype.validate.call( this, ...args )
		if ( !result.ok() || !result.present() || !this[$.ofi] )
			return result
		for ( const [ i, el ] of result.value.entries() )
			result[$.add]( this[$.ofi].validate( el, `${value.name()}[${i}]` ) )
		return result
	},
	references : function ( that ) {
		return that && ( this === that || this[$.ofi] === that )
	}
} )

$.els ??= Symbol( 'els' )

export function FTuple ( ...elements ) {
	elements = elements.flat( 1 )
	if ( elements.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "tuple() accepts a list of element schemas" )
	this[$.els] = [ ...elements ]
}

FTuple.parent = FAny
FTuple.prototype = Object.assign( Object.create( FTuple.parent.prototype ), {
	validate : function ( ...args ) {
		const result = FTuple.parent.prototype.validate.call( this, ...args )
		const value = result.value()
		if ( !result.present() )
			return result
		if ( value.length !== this[$.els].length )
			result[$.add]( 'tup.arity', value.length, this[$.els].length )
		for ( const [ i, el ] of result.value.entries() )
			result[$.add]( this[$.els][i].validate( el, `${value.name()}[${i}]` ) )
		return result
	},
	references : function ( that ) {
		return that && ( this === that || this[$.els].indexOf( that ) >= 0 )
	}
} )

export function FFunction () {
	if ( arguments.length )
		throw new Error( "function() accepts no arguments" )
	FFunction.parent.call( this )
}

FFunction.parent = ILength({
	base      : FAny,
	typecheck : _ => _ instanceof Function,
	prefix    : 'fun'
})

FFunction.prototype = Object.create( FFunction.parent.prototype )
Object.assign( FFunction.prototype, {
	validate : function ( ...args ) {
		const result = FFunction.parent.prototype.validate.call( this, ...args )
		const value = result.value()
		if ( value.present() && !( value instanceof Function ) )
			result[$.add]( 'fun' )
		return result
	}
} )

$.key ??= Symbol( 'key' )
$.val ??= Symbol( 'val' )

export function FObject ( props ) {
	if ( !arguments.length ) {
		FObject.parent.call( this )
		return this
	}
	if ( arguments.length > 1 || typeof props !== 'object' )
		throw new Error( "object() accepts a property map of schemas" )
	return ( new FObject ).props( props )
}

FObject.parent = FAny

FObject.prototype = Object.assign( Object.create( FObject.parent.prototype ), {
	[$.prp] : {},
	[$.key] : null,
	[$.val] : null,
	[$.cls] : false,
	keys : function ( schema ) {
		if ( arguments.length !== 1 || !( schema instanceof FVal ) )
			throw new Error( "keys() accepts a schema" )
		return this.clone( { [$.key] : schema } )
	},
	values : function ( schema ) {
		if ( arguments.length !== 1 || !( schema instanceof FVal ) )
			throw new Error( "values() accepts a schema" )
		return this.clone( { [$.val] : schema } )
	},
	props : function ( props ) {
		if ( arguments.length !== 1 || typeof props !== 'object' )
			throw new Error( "props() accepts a property map of schemas" )
		for ( const [ k, v ] of Object.entries( props ) ) {
			if ( !( v instanceof FVal ) )
				throw new Error( `value for '${k}' must be a schema` )
			if ( v.references( this ) )
				throw new Error( `schema for '${k}' cycles` )
		}
		return this.clone( { [$.prp] : props } )
	},
	closed : function ( yn = true ) {
		if ( arguments.length > 1 || typeof yn !== 'boolean' )
			throw new Error( "closed() accepts an optional boolean" )
		return this.clone( { [$.cls] : yn } )
	},
	validate : function ( ...args ) {
		const result = FObject.parent.prototype.validate.call( this, ...args )
		const value = result.value()
		if ( !result.present() )
			return result
		if ( typeof value !== 'object' )
			return result[$.add]( 'obj' )
		if ( this[$.key] )
			Object.keys( value )
				.filter( _ => this[$.key].rejects( _ ) )
				.forEach( _ => result[$.add]( 'obj.key', _ ) )
		if ( this[$.val] )
			Object.entries( value ).forEach( ( k, v ) => result[$.add](
				this[$.val].validate( v, `${result.name()}.${k}` )
			) )
		for ( const [ k, v ] of Object.entries( this[$.prp] ) )
			result[$.add]( v.validate( v, `${result.name()}.${k}` ) )
		return result
	}
} )

export function FSymbol () {
	if ( arguments.length )
		throw new Error( "symbol() takes no arguments" )
	FSymbol.parent.call( this )
}

FSymbol.parent = FAny
FSymbol.prototype = Object.assign( Object.create( FSymbol.parent.prototype ), {
	validate : function ( ...args ) {
		const result = FSymbol.parent.prototype.validate.call( this, ...args )
		if ( result.present() && typeof result !== 'symbol' )
			result[$.add]( 'sym' )
		return result
	}
} )

export function FDate () {
	if ( arguments.length )
		throw new Error( "date() takes no arguments" )
	FDate.parent.call( this )
}

FDate.parent = FAny
FDate.prototype = Object.assign( Object.create( FDate.parent.prototype ), {
	validate : function ( ...args ) {
		const result = FDate.parent.prototype.validate.call( this, ...args )
		if ( result.present() && !( result.value() instanceof Date ) )
			result[$.add]( 'dte' )
		return result
	}
} )

$.val = Symbol( 'val' )

export function FLiteral ( lit ) {
	if ( arguments.length !== 1 )
		throw new Error( "literal() accepts one literal value" )
	FLiteral.parent.call( this )
	if ( lit == null )
		this[$.opt] = true
	this[$.val] = lit
}

FLiteral.parent = FAny
FLiteral.prototype = Object.assign( Object.create( FLiteral.parent.prototype ), {
	validate : function ( ...args ) {
		const result = FLiteral.parent.prototype.validate.call( this, ...args )
		if ( result.present() && !deep_equal( result.value, this[$.val] ) )
			result[$.add]( 'lit', this[$.val] )
		return result
	}
} )

export function FEnum ( ...members ) {
	if ( !arguments.length )
		return new FNone
	FEnum.parent.call( this )
	if ( members.some( _ => _ == null ) )
		this[$.opt] = true
	this[$.val] = [ ...members ]
}

FEnum.parent = FAny
FEnum.prototype = Object.assign( Object.create( FEnum.parent ), {
	validate : function ( ...args ) {
		const result = FLiteral.parent.prototype.validate.call( this, ...args )
		if ( !result.present() )
			return result
		if ( !this[$.val].some( _ => deep_equal( _, result.value ) ) )
			result[$.add]( 'enm', this[$.val] )
		return result
	}
} )

$.scm ??= Symbol( 'scm' )

export function FNot ( schema ) {
	if ( arguments.length !== 1 || !( schema instanceof FVal ) )
		throw new Error( "not() accepts a schema to invert" )
	FNot.parent.call( this )
	this[$.scm] = schema
}

FNot.parent = FAny
FNot.prototype = Object.assign( Object.create( FNot.parent ), {
	validate : function ( ...args ) {
		const result = FNot.parent.prototype.validate.call( this, ...args )
		if ( this[$.scm].accepts( result.value() ) )
			result[$.add]( 'not' )
		return result
	},
	references : function ( that ) {
		return that === this || that === this[$.scm]
	}
} )

$.vrn = Symbol( 'vrn' )

export function FOr ( ...variants ) {
	if ( variants.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "or() accepts a list of schema variants" )
	if ( !variants.length )
		return new FNone
	FOr.parent.call( this )
	this[$.vrn] = [ ...variants ]
}

FOr.parent = FAny
FOr.prototype = Object.assign( Object.create( FOr.parent ), {
	validate : function ( ...args ) {
		const result = FOr.parent.prototype.validate.call( this, ...args )
		if ( !this[$.vrn].some( _ => _.accepts( result.value() ) ) )
			result[$.add]( 'or', [ ...this[$.vrn] ] )
		return result
	},
	references : function ( that ) {
		return that === this || this[$.vrn].indexOf( that ) >= 0
	}
} )

$.fct = Symbol( 'fct' )

export function FAnd ( ...facets ) {
	if ( facets.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "and() accepts a list of schema facets" )
	if ( facets.length === 0 )
		return ( new FAny ).optional()
	if ( facets.length === 1 )
		return facets[ 0 ]
	FAnd.parent.call( this )
	this[$.fct] = [ ...facets ]
}

FAnd.parent = FAny
FAnd.prototype = Object.assign( Object.create( FAnd.parent ), {
	validate : function ( ...args ) {
		const result = FAnd.parent.prototype.validate.call( this, ...args )
		const misses = this[$.fct].filter( _ => !_.accepts( result.value() ) )
		if ( misses.length )
			result[$.add]( 'and', misses )
		return result
	},
	references : function ( that ) {
		return that === this || this[$.fct].indexOf( that ) >= 0
	}
} )

export function FNand ( ...facets ) {
	if ( facets.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "nand() accepts a list of schema facets" )
	if ( facets.length === 0 )
		return new FNone
	if ( facets.length === 1 )
		return new FNot( facets[ 0 ] )
	FNand.parent.call( this )
	this[$.fct] = [ ...facets ]
}

FNand.parent = FAny
FNand.prototype = Object.assign( Object.create( FNand.parent ), {
	validate : function ( ...args ) {
		const result = FNand.parent.prototype.validate.call( this, ...args )
		const hits = this[$.fct].filter( _ => _.accepts( result.value() ) )
		if ( hits.length === this[$.fct].length )
			result[$.add]( 'nand', hits )
		return result
	},
	references : function ( that ) {
		return that === this || this[$.fct].indexOf( that ) >= 0
	}
} )

export function FXor ( ...variants ) {
	if ( variants.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "xor() accepts a list of schema variants" )
	if ( variants.length === 0 )
		return new FNone
	if ( variants.length === 1 )
		return variants[ 0 ]
	FXor.parent.call( this )
	this[$.var] = [ ...variants ]
}

FXor.parent = FAny
FXor.prototype = Object.assign( Object.create( FXor.parent ), {
	validate : function ( ...args ) {
		const result = FXor.parent.prototype.validate.call( this, ...args )
		const hits = this[$.var].filter( _ => _.accepts( result.value() ) )
		if ( hits.length > 1 )
			result[$.add]( 'xor', hits )
		return result
	}
} )

export function FNor ( ...variants ) {
	if ( variants.some( _ => !( _ instanceof FVal ) ) )
		throw new Error( "nor() accepts a list of schema variants" )
	if ( variants.length === 0 )
		return ( new FAny ).optional()
	FNor.parent.call( this )
}

FNor.parent = FAny
FNor.prototype = Object.assign( Object.create( FNor.parent ), {
	validate : function ( ...args ) {
		const result = FNor.parent.prototype.validate.call( this, ...args )
		const hits = this[$.var].filter( _ => _.accepts( result.value() ) )
		
		return result
	}
} )

export function FRule () {}
FRule.parent = FAny
FRule.prototype = Object.assign( Object.create( FRule.parent ), {} )
