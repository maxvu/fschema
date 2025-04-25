'use strict'
const $valid = Symbol( 'FSchema#validate_internal' )
const $refs = Symbol( 'FSchema#references' )
const $clone = Symbol( 'FSchema#clone' )

function deep_equal ( a, b ) {
	let ka, kb, oa, ob ;
	if ( a === b || ( Number.isNaN( a ) && Number.isNaN( b ) ) )
		return true
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

const extend = ( parent, proto ) => {
	const decls = {}
	proto = Object.assign(
		Object.create( parent ? parent.prototype : null ),
		proto )
	for ( const k of Object.getOwnPropertyNames( proto ) )
		decls[ k ] = {
			configurable : false,
			enumerable   : k.indexOf( '_' ) !== 0
		}
	return Object.defineProperties( proto, decls )
}
const STRINGS = Object.freeze({
	'non'     : ({ label }) => `${label} has no acceptable value`,
	'opt'     : ({ label }) => `${label} must be present`,
	'bul'     : ({ label }) => `${label} must be a boolean`,
	'num'     : ({ label }) => `${label} must be a number`,
	'num.min' : ({ label, args }) => `${label} must at least ${args[0]}`,
	'num.max' : ({ label, args }) => `${label} must be at most ${args[0]}`,
	'num.xmn' : ({ label, args }) => `${label} must be greater than ${args[0]}`,
	'num.xmx' : ({ label, args }) => `${label} must be less than ${args[0]}`,
	'num.fin' : ({ label }) => `${label} must be finite`,
	'int'     : ({ label }) => `${label} must be a safe integer`,
	'big'     : ({ label }) => `${label} must be a BigInt`,
	'len'     : ({ label }) => `${label} must have length`,
	'len.eq'  : ({ label, args }) => `${label} must have length ${args[0]}`,
	'len.min' : ({ label, args }) => `${label} have at least length ${args[0]}`,
	'len.max' : ({ label, args }) => `${label} have at most length ${args[0]}`,
	'str'     : ({ label }) => `${label} must be a string`,
	'str.pat' : ({ label, args }) => `${label} must match pattern ${args[0]}`,
	'tup'     : ({ label }) => `${label} must be array-like`,
	'tup.cls' : ({ label, args }) =>
		`${label} must have at most ${args[0]} members`,
	'arr'     : ({ label }) => `${label} must be an array`,
	'fun'     : ({ label }) => `${label} must be a function`,
	'obj'     : ({ label }) => `${label} must be an object`,
	'obj.typ' : ({ label, args }) =>
		`${label} must be an instance of ${args[0].name}`,
	'obj.cls' : ({ label, args }) =>
		`${label} must not have unenumerated property '${args[0]}'`,
	'obj.key' : ({ label, args }) =>
		`${label} must not have invalid key '${args[0]}`,
	'lit'     : ({ label }) => `${label} must match the named value`,
	'enm'     : ({ label }) => `${label} must match one of the named values`,
	'ano'     : ({ label }) => `${label} must match one of the names schemas`,
	'ono.mlt' : ({ label }) => `${label} matched more than one named schema`,
	'ono.non' : ({ label }) => `${label} matched none of the named schemas`,
	'nno'     : ({ label }) => `${label} must match none of the named schemas`,
	'rul'     : ({ label }) => `${label} must match the named rule`,
})

function SchemaViolation ( { schema, value, label, code, args } ) {
	Object.assign( this,{ schema, value, label, code, args } ) }

function ValidationBuilder ( { schema, value, label, strings, quick } ) {
	if ( !( schema instanceof FSchema ) )
		throw new Error( "invalid schema" )
	this._scm = schema
	this._val = value
	if ( label ) {
		if ( typeof label !== 'string' )
			throw new Error( "invalid value label" )
		this._lbl = label
	}
	if ( strings ) {
		if ( typeof strings !== 'object' && !( strings instanceof Function ) )
			throw new Error( "invalid string table" )
		this._str = strings
	}
	if ( quick != null )
		this._qck = quick
}

ValidationBuilder.prototype = extend( null, {
	_lbl : 'value',
	_str : STRINGS,
	_qck : false,
	_vio : null,
	schema () { return this._scm },
	value  () { return this._val },
	label  () { return this._lbl },
	quick  () { return this._qck },
	ok () { return !this._vio || !this._vio.length },
	add ( that, ...args ) {
		if ( that instanceof ValidationBuilder ) {
			if ( that._vio && that._vio.length )
				this._vio = ( this._vio ?? [] ).concat( that._vio ?? [] )
			return this
		}

		if ( !this._vio ) this._vio = []

		let details = {
			code   : this.schema()._cod ?? that,
			schema : this.schema(),
			value  : this.value(),
			label  : this.label(),
			args }
		let message

		if ( this._str instanceof Function ) {
			try {
				this._vio.push( this._str( details ) )
				return this
			} catch {}
		}

		if ( typeof this._str === 'object' ) {
			const entry = this._str[ details.code ]
			if ( typeof entry === 'string' ) {
				this._vio.push( entry )
				return this
			} else if ( entry instanceof Function ) {
				try {
					this._vio.push( entry( details ) )
					return this
				} catch {}
			}
		}

		this._vio.push( ValidationBuilder.PLACEHOLDER_MESSAGE( details ) )
		return this
	},
	subvalue ( schema, value, label ) {
		return this.add( schema[$valid]( new ValidationBuilder({
			schema, value, label,
			strings : this._str,
			quick   : this._qck
		}) ) )
	},
	build () { return this._vio }
} )

ValidationBuilder.PLACEHOLDER_MESSAGE =
	({ label }) => `${label} failed validation`

function FSchema () {}

FSchema.prototype = extend( null, {
	_cod : null,
	[$valid] ( builder ) { return builder },
	[$refs] ( that ) { return this === that },
	[$clone] ( opts ) {
		const clone = Object.create( Object.getPrototypeOf( this ) )
		Object.assign( clone, this, opts )
		if ( clone.prototype )
			for ( const k of Object.getOwnPropertyNames( clone ) )
				if ( clone[ k ] === clone.prototype[ k ] )
					delete clone[ k ]
		return clone
	},
	code ( code = null ) {
		if ( typeof code !== 'string' || !code.length )
			throw new Error( "code must be a non-empty string" )
		if ( code in STRINGS )
			throw new Error( `code '${code}' conflicts with a predefined` )
		return this[$clone]({ _cod : code })
	},
	validate ( value, label, strings ) {
		return this[$valid]( new ValidationBuilder({
			schema : this, value, label, strings
		}) ).build()
	},
	assert ( value, label, strings ) {
		const messages = this[$valid]( new ValidationBuilder({
			schema : this, value, quick : true
		}) ).build()
		if ( messages )
			throw new Error( messages[ 0 ] )
		return messages
	},
	accepts ( value ) {
		return null === this[$valid]( new ValidationBuilder({
			schema : this, value, quick : true
		}) ).build()
	},
	rejects ( value ) { return !this.accepts( value ) }
} )

function FNone () {}

FNone.prototype = extend( FSchema, {
	[$valid] ( builder ) { return builder.add( 'non' ) }
} )

function FAny () {}

FAny.prototype = extend( FSchema, {
	_opt : false,
	optional ( yn = true, ...rest ) {
		if ( typeof yn !== 'boolean' || rest.length )
			throw new Error( "optional() expects an optional boolean" )
		return this[$clone]({ _opt : yn })
	},
	[$valid] ( builder ) {
		return !this._opt && builder.value() == null
			? builder.add( 'opt' )
			: builder
	}
} )

function FBoolean () {}

FBoolean.prototype = extend( FAny, {
	[$valid] ( builder ) {
		FAny.prototype[$valid].call( this, builder )
		if ( builder.value() != null && typeof builder.value() !== 'boolean' )
			builder.add( 'bul' )
		return builder
	}
} )

const INumeric = ({
	typecheck, code, default_min = null, default_max = null
}) => {
	function INumeric ( ...args ) {
		FAny.call( this, ...args )
	}

	INumeric.prototype = extend( FAny, {
		_min : default_min,
		_max : default_max,
		_xlo : false,
		_xhi : false,
		range ( min, max, xlo, xhi, ...rest ) {
			if ( min === undefined || max === undefined )
				throw new Error( "range() expects a low and high bound" )
			if ( xlo != null && typeof xlo !== 'boolean'
				|| xhi != null && typeof xhi !== 'boolean' )
				throw new Error( "range() clusivities must be boolean" )
			if ( rest.length )
				throw new Error( "too many arguments to range()" )
			min ??= this._min
			max ??= this._max
			xlo ??= this._xlo
			xhi ??= this._xhi

			if ( min !== null && !typecheck( min ) )
				throw new Error( "wrong-type lower bound" )
			if ( max !== null && !typecheck( max ) )
				throw new Error( "wrong-type upper bound" )
			if ( min !== null && max !== null && min > max )
				throw new Error( "inverted bounds" )
			return this[$clone]({
				_min : min, 
				_max : max, 
				_xlo : xlo, 
				_xhi : xhi, })
		},
		between ( lo, hi, ...rest ) {
			if ( rest.length )
				throw new Error( "between() expects a low and high bound" )
			return this.range( lo, hi )
		},
		gte ( n, ...rest ) {
			if ( rest.length )
				throw new Error( "gte() expects an inclusive lower bound" )
			return this.range( n, null, false, null ) },
		lte ( n, ...rest ) {
			if ( rest.length )
				throw new Error( "lte() expects an inclusive upper bound" )
			return this.range( null, n, null, false ) },
		gt ( n, ...rest ) {
			if ( rest.length )
				throw new Error( "gt() expects an exclusive lower bound" )
			return this.range( n, null, true, null ) },
		lt ( n, ...rest ) {
			if ( rest.length )
				throw new Error( "lt() expects an exclusive upper bound" )
			return this.range( null, n, null, true ) },
		[$valid] ( builder ) {
			FAny.prototype[$valid].call( this, builder )
			const val = builder.value()
			if ( val == null || !builder.ok() )
				return builder
			if ( !typecheck( val ) )
				return builder.add( code )
			if ( this._min != null ) {
				if ( !this._xlo && val < this._min )
					return builder.add( 'num.min', this._min )
				else if ( this._xlo && val <= this._min )
					return builder.add( 'num.xmn', this._min )
			}
			if ( this._max != null ) {
				if ( !this._xhi && val > this._max )
					return builder.add( 'num.max', this._max )
				else if ( this._xhi && val >= this._max )
					return builder.add( 'num.xmx', this._max )
			}
			return builder
		}
	} )

	return INumeric
}

function FNumber () { FNumber.parent.call( this ) }

FNumber.parent = INumeric({
	typecheck   : _ => typeof _ === 'number',
	code        : 'num',
	default_min : -Infinity,
	default_max : Infinity
})

FNumber.prototype = extend( FNumber.parent, {
	range ( ...args ) {
		const finite = Number.isFinite
		const clone = FNumber.parent.prototype.range.call( this, ...args )
		if ( clone._fin && ( !finite( clone._min ) || !finite( clone._max ) ) )
			throw new Error( "non-finite bound on finite number" )
		return clone
	},
	finite ( yn = true, ...rest ) {
		if ( typeof yn !== 'boolean' || rest.length )
			throw new Error( "finite() expects a boolean" )
		return this[$clone]( yn 
			? {
				_fin : true,
				// march the bounds into the the finites
				_min : Math.max( this._min, Number.MIN_VALUE ),
				_max : Math.min( this._max, Number.MAX_VALUE ), }
			: { _fin : false } )
	},
	[$valid] ( builder ) {
		const val = builder.value()
		// check finiteness before checking bounds
		if ( this._fin && val != null && !Number.isFinite( val ) )
			return builder.add( 'num.fin' )
		return FNumber.parent.prototype[$valid].call( this, builder )
	}
} )

function FInteger () { FInteger.parent.call( this ) }

FInteger.parent = INumeric({
	typecheck   : Number.isSafeInteger,
	code        : 'int',
	default_min : Number.MIN_SAFE_INTEGER,
	default_max : Number.MAX_SAFE_INTEGER
})

FInteger.prototype = extend( FInteger.parent, {} )

function FBigInt () { FBigInt.parent.call( this ) }

FBigInt.parent = INumeric({
	typecheck   : _ => typeof _ === 'bigint',
	code        : 'big',
})

FBigInt.prototype = extend( FBigInt.parent, {} )

const ILength = ({ typecheck, code }) => {
	function ILength () { FAny.call( this ) }

	ILength.prototype = extend( FAny, {
		_leq : null,
		_lmn : null,
		_lmx : null,
		length ( ...args ) {
			if ( !args.every( Number.isSafeInteger ) )
				throw new Error( "length() accepts one or two safe integers" )
			if ( args.length === 1 ) {
				const [ leq ] = args
				return this[$clone]({ _leq : leq, _lmn : null, _lmx : null })
			} else if ( args.length == 2 ) {
				const [ lmn, lmx ] = args
				if ( lmx < lmn )
					throw new Error( "inverted length() bounds" )
				return this[$clone]({ _leq : null, _lmn : lmn, _lmx : lmx })
			}
			throw new Error( "length() accepts length or low and high bounds" )
		},
		[$valid] ( builder ) {
			const val = builder.value()
			FAny.prototype[$valid].call( this, builder )
			if ( val == null )
				return builder
			if ( !typecheck( val ) )
				return builder.add( code )
			if ( typeof val.length !== 'number' )
				return builder.add( 'len' )
			if ( this._leq !== null && val.length !== this._leq )
				return builder.add( 'len.eq', this._leq )
			if ( this._lmn !== null && val.length < this._lmn )
				return builder.add( 'len.min', this._leq )
			if ( this._lmx !== null && val.length > this._lmx )
				return builder.add( 'len.max', this._lmx )
			return builder
		},
	} )

	return ILength
}

function FString () { FString.parent.call( this ) }

FString.parent = ILength({
	typecheck : _ => typeof _ === 'string',
	code      : 'str'
})

FString.prototype = extend( FString.parent, {
	_pat : null,
	pattern ( p, ...rest ) {
		if ( rest.length || !( p instanceof RegExp ) )
			throw new Error( "pattern() accepts one RegExp" )
		return this[$clone]({ _pat : p })
	},
	[$valid] ( builder ) {
		const val = builder.value()
		FString.parent.prototype[$valid].call( this, builder )
		if ( this._pat && val != null && !val.match( this._pat ) )
			builder.add( 'str.pat', this._pat )
		return builder
	}
} )

function FArray ( itm = null, ...rest ) {
	if ( ( itm !== null && !( itm instanceof FSchema ) ) || rest.length )
		throw new Error( "array() accepts a single item schema" )
	FArray.parent.call( this )
	this._itm = itm
}

FArray.parent = ILength({
	typecheck : _ => _ instanceof Array,
	code      : 'arr'
})

FArray.prototype = extend( FArray.parent, {
	[$refs] ( that ) {
		return this === that || ( this._itm && this._itm[$refs]( that ) )
	},
	[$valid] ( builder ) {
		const [ val, lbl ] = [ builder.value(), builder.label() ]
		FArray.parent.prototype[$valid].call( this, builder )
		if ( val == null || !builder.ok() )
			return builder
		for ( const [ i, itm ] of val.entries() ) {
			if ( builder.quick() && !builder.ok() )
				return builder
			builder.subvalue( this._itm, itm, `${lbl}[${i}]` )
		}
		return builder
	},
} )

function FTuple ( ...members ) {
	FAny.call( this )
	this._mbs = members
	if ( this._mbs.some( _ => !( _ instanceof FSchema ) ) )
		throw new Error( "tuple() accepts only schemas" )
	if ( this._mbs.some( _ => _[$refs]( this ) ) )
		throw new Error( "cyclical reference in tuple member" )
}

FTuple.prototype = extend( FAny, {
	_cls : false,
	[$refs] ( that ) {
		return this === that || this._mbs.some( _ => _[$refs]( that ) ) },
	closed ( yn = true, ...rest ) {
		if ( typeof yn !== 'boolean' || rest.length )
			throw new Error( "closed() expects a boolean" )
		return this[$clone]({ _cls : yn })
	},
	[$valid] ( builder ) {
		const [ val, lbl ] = [ builder.value(), builder.label() ]
		FAny.prototype[$valid].call( this, builder )
		if ( val == null || !builder.ok() )
			return builder
		if ( typeof val !== 'object' || typeof val.length !== 'number' )
			return builder.add( 'tup' )
		if ( this._cls && val.length > this._mbs.length )
			builder.add( 'tup.cls', this._mbs.length )
		for ( const [ i, mbr ] of this._mbs.entries() ) {
			if ( builder.quick() && !builder.ok() )
				return builder
			builder.subvalue( mbr, val[i], `${lbl}[${i}]` )
		}
		return builder
	}
} )

function FFunction () { FAny.call( this ) }

FFunction.prototype = extend( FAny, {
	[$valid] ( builder ) {
		const val = builder.value()
		FAny.prototype[$valid].call( this, builder )
		if ( val != null && !( val instanceof Function ) )
			builder.add( 'fun' )
		return builder }
} )

function IObject ( props = null, ...rest ) {
	if ( props != null && typeof props !== 'object' )
		throw new Error( "property specification must be an object-of-schemas" )
	props ??= {}
	for ( let k of Object.getOwnPropertyNames( props ) ) {
		if ( !( props[ k ] instanceof FSchema ) )
			throw new Error( `property '${k}' must be a schema` )
	}
	FAny.call( this )
	if ( Object.keys( props ).length )
		this._prp = { ...props }
}

IObject.prototype = extend( FAny, {
	_prp : null,
	_typ : null,
	_cls : false,
	[$refs] ( that ) {
		if ( this === that ) return true
		if ( this._kys && this._kys[$refs]( that ) ) return true
		if ( this._vls && this._vls[$refs]( that ) ) return true
		for ( const [ prop, scm ] of Object.entries( this._prp ?? {} ) )
			if ( scm[$refs]( that ) )
				return true
		return false
	},
	type ( typ, ...rest ) {
		if ( !( typ instanceof Function )
			|| !typ[ Symbol.hasInstance ]
			|| rest.length )
			throw new Error( "type() expects a constructor function" )
		return this[$clone]({ _typ : typ })
	},
	[$valid] ( builder ) {
		const obj = builder.value()
		const lbl = builder.label()
		FAny.prototype[$valid].call( this, builder )
		if ( obj == null )
			return builder
		if ( typeof obj !== 'object' )
			return builder.add( 'obj' )
		if ( this._typ && !( obj instanceof this._typ ) )
			builder.add( 'obj.typ', this._typ )
		for ( const [ key, schema ] of Object.entries( this._prp ?? {} ) ) {
			builder.subvalue( schema, obj[ key ], `${lbl}.${key}` )
			if ( builder.quick() && !builder.ok() )
				return builder
		}
		if ( this._cls ) {
			for ( const k of Object.getOwnPropertyNames( obj ) ) {
				if ( builder.quick() && !builder.ok() )
					return builder
				if ( !this._prp || !( k in this._prp ) )
					builder.add( 'obj.cls', k )
			}
		}
		return builder
	}
} )

function FObject ( props ) {
	IObject.call( this, props )
}

FObject.prototype = extend( IObject, {
	_cls : false,
	_kys : null,
	_vls : null,
	keys ( kys, ...rest ) {
		if ( !( kys instanceof FSchema ) || rest.length )
			throw new Error( "keys() expects a schema" )
		if ( kys[$refs]( this ) )
			throw new Error( "cyclic schema reference" )
		return this[$clone]({ _kys : kys })
	},
	values ( vls, ...rest ) {
		if ( !( vls instanceof FSchema ) || rest.length )
			throw new Error( "values() expects a schema" )
		if ( vls[$refs]( this ) )
			throw new Error( "cyclic schema reference" )
		return this[$clone]({ _vls : vls })
	},
	[$valid] ( builder ) {
		const [ obj, lbl ] = [ builder.value(), builder.label() ]
		IObject.prototype[$valid].call( this, builder )
		for ( const k in obj ) {
			if ( builder.quick() && !builder.ok() )
				return builder
			if ( this._kys && !this._kys.accepts( k ) )
				builder.add( 'obj.key', k )
			if ( this._vls )
				builder.subvalue( this._vls, obj[ k ], `${lbl}.${k}` )
		}
		return builder
	},
} )

function FStruct ( props ) {
	IObject.call( this, props )
}

FStruct.prototype = extend( IObject, {
	_cls : true,
} )

function FLiteral ( ...args ) {
	if ( args.length !== 1 )
		throw new Error( "literal() accepts one literal value" )
	FAny.call( this )
	this._lit = args[ 0 ]
}

FLiteral.prototype = extend( FAny, {
	[$valid] ( builder ) {
		const val = builder.value()
		if ( this._opt && val == null )
			return builder
		if ( !deep_equal( this._lit, val ) )
			builder.add( 'lit', this._lit )
		return builder
	}
} )

function FEnum ( ...variants ) {
	FAny.call( this )
	this._vrn = variants
}

FEnum.prototype = extend( FAny, {
	[$valid] ( builder ) {
		const val = builder.value()
		if ( this._opt && val == null )
			return builder
		if ( !this._vrn.some( _ => deep_equal( _, val ) ) )
			return builder.add( 'enm', this._vrn )
		return builder
	}
} )

const ICompound = ( ({ name }) => {
	function ICompound ( ...subschemas ) {
		if ( subschemas.some( _ => !( _ instanceof FSchema ) ) )
			throw new Error( `${name}() accepts a list of schemas` )
		if ( subschemas.length )
			this._scs = subschemas
	}

	ICompound.prototype = extend( FAny, {
		[$refs] ( that ) {
			if ( this === that )
				return true
			return this._scs && this._scs.some( _ => _[$refs]( that ) )
		}
	} )

	return ICompound
} )

function FAnyOf ( ...subschemas ) {
	FAnyOf.parent.call( this, ...subschemas )
}

FAnyOf.parent = ICompound({ name : "any_of" })

FAnyOf.prototype = extend( FAnyOf.parent, {
	[$valid] ( builder ) {
		const val = builder.value()
		if ( val == null && this._opt )
			return builder
		for ( const subschema of this._scs ?? [] )
			if ( subschema.accepts( val ) )
				return builder
		builder.add( 'ano', [ ...this._scs ] )
		return builder
	}
} )

function FAllOf ( ...subschemas ) { FAnyOf.parent.call( this, ...subschemas ) }

FAllOf.parent = ICompound({ name : "all_of" })

FAllOf.prototype = extend( FAllOf.parent, {
	[$valid] ( builder ) {
		const val = builder.value()
		if ( val == null && this._opt )
			return builder
		for ( const subschema of this._scs ?? [] ) {
			builder.subvalue( subschema, val, builder.label() )
			if ( builder.quick() && !builder.ok() )
				break
		}
		return builder
	}
} )

function FOneOf ( ...subschemas ) { FAnyOf.parent.call( this, ...subschemas ) }

FOneOf.parent = ICompound({ name : "one_of" })

FOneOf.prototype = extend( FOneOf.parent, {
	[$valid] ( builder ) {
		const val  = builder.value()
		let   hits = []
		if ( val == null && this._opt )
			return builder
		for ( const subschema of this._scs ?? [] ) {
			if ( subschema.accepts( val ) ) {
				hits.push( subschema )
				if ( hits.length > 1 )
					return builder.add( 'ono.mlt', ...hits )
			}
		}
		if ( !hits.length )
			builder.add( 'ono.non' )
		return builder
	}
} )

function FNoneOf ( ...subschemas ) { FAnyOf.parent.call( this, ...subschemas ) }

FNoneOf.parent = ICompound({ name : "none_of" })

FNoneOf.prototype = extend( FNoneOf.parent, {
	[$valid] ( builder ) {
		const val = builder.value()
		if ( val == null && this._opt )
			return builder
		for ( const subschema of this._scs ?? [] ) {
			if ( subschema.accepts( val ) )
				return builder.add( 'nno', subschema )
		}
		return builder
	}
} )

function FRule ( test, ...context ) {
	console.log( test )
	if ( !( test instanceof Function ) )
		throw new Error( "rule schema test must be a Function" )
	FAny.call( this )
	this._tst = test
	if ( context.length )
		this._ctx = context
}

FRule.prototype = extend( FAny, {
	[$valid] ( builder ) {
		if ( this._opt && builder.value() === null )
			return builder
		if ( !this._tst( builder.value(), ...[ ...this._ctx ?? [] ] ) )
			builder.add( 'rul' )
		return builder
	}
} )

for ( const [ name, type ] of Object.entries({
	none     : FNone,
	any      : FAny,
	boolean  : FBoolean,
	number   : FNumber,
	integer  : FInteger,
	bigint   : FBigInt,
	string   : FString,
	function : FFunction
}) ) {
	module.exports[ name ] = ( ...args ) => {
		if ( args.length )
			throw new Error( `${name}() expects no arguments` )
		return new type
	}
}

for ( const [ name, type ] of Object.entries({
	array   : FArray,
	tuple   : FTuple,
	object  : FObject,
	struct  : FStruct,
	literal : FLiteral,
	enum    : FEnum,
	any_of  : FAnyOf,
	all_of  : FAllOf,
	one_of  : FOneOf,
	none_of : FNoneOf,
	rule    : FRule,
}) ) {
	module.exports[ name ] = ( ...args ) => new type( ...args )
}

module.exports.STRINGS = STRINGS
