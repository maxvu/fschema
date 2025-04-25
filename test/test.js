'use strict'
const assert = require( 'node:assert' )
const { describe, it } = require( 'node:test' )
const $ = {}

// Shim the schemas with methods that make testing prettier.
for ( const [ name, ctor ] of Object.entries( require( './' ) ) ) {
	$[ name ] = ( ...args ) => {
		const schema = ctor( ...args )

		const str = s => {
			try { return `${s}` }
			catch { return '(unrepresentable)' }
		}

		schema.must_accept = function ( ...vals ) {
			for ( let val of vals ) {
				const messages = this.validate( val, 'value', _ => _ )
				if ( messages === null )
					continue
				if ( messages.some( _ => typeof _.code !== 'string' ) )
					console.log( messages )
				const codes = messages.map( _ => _.code ).sort().join( ',' )
				assert( messages === null,
					`schema incorrectly rejected <${str(val)}> with <${codes}>` )
			}
			return this
		}

		schema.must_reject_with = function ( expected, ...vals ) {
			expected = expected.split( ',' ).sort().join( ',' )

			for ( let val of vals ) {
				const messages = this.validate( val, 'value', _ => _ )
				assert.notEqual( messages, null,
					`schema incorrectly accepted ${str(val)}` )
				const actual = messages.map( _ => _.code ).sort().join( ',' )
				assert.equal(
					actual,
					expected,
					`schema rejected with ${actual} instead of ${expected}` )
			}

			return this
		}

		schema.must_clone_on = function ( fn ) {
			assert( fn( this ) !== this,
				"schema returned self instead of cloning" )
			return this
		}

		return schema
	}
}

describe( "none()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.none( 1 ) ) )

	it( "accepts no values", () =>
		$.none()
			.must_reject_with( 'non', 1, false, null, undefined, {}, [] ) )
} )

describe( "any()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.any( 1 ) ) )

	it( "accepts present values", () =>
		$.any().must_accept( 0, false, {}, [], Symbol() ) )

	it( "rejects absent values unless marked optional", () => {
		$.any().must_reject_with( 'opt', null, undefined )
		$.any().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.any().optional( {} ) )
		assert.throws( () => $.any().optional( true, false ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.any().must_clone_on( _ => _.optional() )
	} )
} )

describe( "boolean()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.boolean( 1 ) ) )

	it( "accepts only boolean values", () => {
		$.boolean().must_accept( true )
		$.boolean().must_reject_with( 'bul', -1, [], 'g', {}, Symbol() )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.boolean().must_reject_with( 'opt', null, undefined )
		$.boolean().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.boolean().optional( {} ) )
		assert.throws( () => $.boolean().optional( true, false ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.boolean().must_clone_on( _ => _.optional() )
	} )
} )

describe( "number()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.number( 1 ) ) )

	it( "accepts only numeric values", () => {
		$.number().must_accept( -0, 1.5, Infinity, NaN, 1e100 )
		$.number().must_reject_with( 'num', '0', {}, Symbol(), [] )
	} )

	it( "bounds values with range()", () => {
		const A = $.number().gte( 5 ).lt( 12 )
		const B = $.number().gt( 17 ).lte( 23 )

		A.must_reject_with( 'num.min', 4 )
		A.must_reject_with( 'num.xmx', 12 )
		B.must_reject_with( 'num.xmn', 17 )
		B.must_reject_with( 'num.max', 24 )
	} )

	it( "rejects non-finite values when marked finite", () => {
		$.number().must_accept( -Infinity, Infinity, NaN )
		$.number().finite().must_reject_with(
			'num.fin', -Infinity, Infinity, NaN )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.number().must_reject_with( 'opt', null, undefined )
		$.number().optional( true ).must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.number().optional( 1 ) )
		assert.throws( () => $.number().range() )
		assert.throws( () => $.number().between() )
		assert.throws( () => $.number().gt( 0, 1, 2, 3 ) )
		assert.throws( () => $.number().gte( {} ) )
		assert.throws( () => $.number().lte( [] ) )
		assert.throws( () => $.number().lt( Symbol() ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.number()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.range( 0, 100 ) )
			.must_clone_on( _ => _.between( 0, 100 ) )
			.must_clone_on( _ => _.gte( 0 ) )
			.must_clone_on( _ => _.gt( 0 ) )
			.must_clone_on( _ => _.lte( 100 ) )
			.must_clone_on( _ => _.lt( 100 ) )
			.must_clone_on( _ => _.finite( true ) )
	} )
} )

describe( "integer()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.integer( 1 ) ) )

	it( "accepts only safe integers", () => {
		$.integer().must_accept( -0, 5, 9500 )
		$.integer().must_reject_with( 'int', false, [], 1e99999 )
	} )

	it( "bounds values with range()", () => {
		const A = $.integer().gte( 5 ).lt( 12 )
		const B = $.integer().gt( 17 ).lte( 23 )

		A.must_reject_with( 'num.min', 4 )
		A.must_reject_with( 'num.xmx', 12 )
		B.must_reject_with( 'num.xmn', 17 )
		B.must_reject_with( 'num.max', 24 )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.integer().must_reject_with( 'opt', null, undefined )
		$.integer().optional( true ).must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.integer().optional( 1 ) )
		assert.throws( () => $.integer().range() )
		assert.throws( () => $.integer().between() )
		assert.throws( () => $.integer().gt( 0, 1, 2, 3 ) )
		assert.throws( () => $.integer().gte( {} ) )
		assert.throws( () => $.integer().lte( [] ) )
		assert.throws( () => $.integer().lt( Symbol() ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.integer()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.range( 0, 100 ) )
			.must_clone_on( _ => _.between( 0, 100 ) )
			.must_clone_on( _ => _.gte( 0 ) )
			.must_clone_on( _ => _.gt( 0 ) )
			.must_clone_on( _ => _.lte( 100 ) )
			.must_clone_on( _ => _.lt( 100 ) )
	} )
} )

describe( "bigint()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.bigint( 1 ) ) )

	it( "accepts only safe bigints", () => {
		$.bigint().must_accept( 0n, -10000000000n )
		$.bigint().must_reject_with( 'big', 1, 'h' )
	} )

	it( "bounds values with range()", () => {
		const A = $.bigint().gte( 5n ).lt( 12n )
		const B = $.bigint().gt( 17n ).lte( 23n )

		A.must_reject_with( 'num.min', 4n )
		A.must_reject_with( 'num.xmx', 12n )
		B.must_reject_with( 'num.xmn', 17n )
		B.must_reject_with( 'num.max', 24n )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.bigint().must_reject_with( 'opt', null, undefined )
		$.bigint().optional( true ).must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.bigint().optional( 1 ) )
		assert.throws( () => $.bigint().range() )
		assert.throws( () => $.bigint().between() )
		assert.throws( () => $.bigint().gt( 0, 1, 2, 3 ) )
		assert.throws( () => $.bigint().gte( {} ) )
		assert.throws( () => $.bigint().lte( [] ) )
		assert.throws( () => $.bigint().lt( Symbol() ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.bigint()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.range( 0n, 100n ) )
			.must_clone_on( _ => _.between( 0n, 100n ) )
			.must_clone_on( _ => _.gte( 0n ) )
			.must_clone_on( _ => _.gt( 0n ) )
			.must_clone_on( _ => _.lte( 100n ) )
			.must_clone_on( _ => _.lt( 100n ) )
	} )
} )

describe( "string()", () => {
	it( "expects no arguments", () =>
		assert.throws( () => $.string( 'one' ) ) )

	it( "accepts only primitive strings", () => {
		$.string().must_accept( '', 'abc' )
		$.string().must_reject_with( 'str', new String( 'abc' ), {} )
	} )

	it( "enforces length()", () => {
		$.string().length( 2, 4 )
			.must_accept( 'ab', 'abc', 'abcd' )
			.must_reject_with( 'len.min', '', 'a' )
			.must_reject_with( 'len.max', 'abcde', 'abcdef' )
	} )

	it( "enforces pattern()", () => {
		$.string().pattern( /^a+$/ )
			.must_accept( 'a', 'aa', 'aaa' )
			.must_reject_with( 'str.pat', 'b' )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.string().must_reject_with( 'opt', null, undefined )
		$.string().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.string().optional( 1 ) )
		assert.throws( () => $.string().length() )
		assert.throws( () => $.string().length( 1, 2, 3 ) )
		assert.throws( () => $.string().pattern() )
		assert.throws( () => $.string().pattern( {} ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.string()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.length( 1, 100 ) )
			.must_clone_on( _ => _.pattern( /a/ ) )
	} )
} )

describe( "array()", () => {
	it( "constructs only a single, optional schema", () => {
		$.array()
		$.array( $.any() )
		assert.throws( () => $.array( 'one' ) )
		assert.throws( () => $.array( {} ) )
	} )

	it( "accepts only arrays", () => {
		$.array().must_accept( [], new Array )
			.must_reject_with( 'arr', 1, false, '-g', {} )
	} )

	it( "enforces item schema", () => {
		$.array( $.boolean() )
			.must_accept( [], [ true ] )
			.must_reject_with( 'bul', [ 1 ], [ true, true, 5 ] )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.array().must_reject_with( 'opt', null, undefined )
		$.array().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.array().optional( '_' ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.array()
			.must_clone_on( _ => _.optional() )
	} )
} )

describe( "tuple()", () => {
	it( "constructs only with schemas", () => {
		$.tuple()
		$.tuple( $.number() )
		assert.throws( () => $.tuple( 'one' ) )
	} )

	it( "accepts only array-likes with matching members", () => {
		$.tuple(
			$.boolean().optional(),
			$.integer().between( 3, 7 ) )
		.must_accept( [ null, 5 ], [ true, 3 ] )
		.must_accept({ '0' : true, '1' : 4, length : 2 })
		.must_reject_with( 'tup', {}, Symbol(), 'g', 5 )
		.must_reject_with( 'bul', [ 'n', 6 ] )
		.must_reject_with( 'int', [ false, 'p' ] )
	} )

	it( "rejects unenumerated members when marked closed()", () => {
		$.tuple( $.string(), $.string() )
			.must_accept( [ 'a', 'b', 'c' ] )
		$.tuple( $.string(), $.string() ).closed()
			.must_reject_with( 'tup.cls', [ 'a', 'b', 'c' ] )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.tuple().must_reject_with( 'opt', null, undefined )
		$.tuple().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.tuple().optional( 1 ) )
		assert.throws( () => $.tuple().closed( 'g' ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.tuple()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.closed() )
	} )
} )

describe( "function()", () => {
	it( "constructs with no parameters", () => {
		$.function()
		assert.throws( () => $.function( () => {} ) )
	} )

	it( "accepts only functions", () => {
		$.function().must_accept( () => {}, function () {} )
			.must_reject_with( 'fun', 1, 'g', Symbol() )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.function().must_reject_with( 'opt', null, undefined )
		$.function().optional().must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.function().optional( 1 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.function()
			.must_clone_on( _ => _.optional() )
	} )
} )

describe( "object()", () => {
	it( "constructs with a property map", () => {
		$.object()
		$.object( {} )
		$.object( { x : $.integer(), y : $.integer() } )
		assert.throws( () => $.object( () => {} ) )
		assert.throws( () => $.object( 1 ) )
	} )

	it( "accepts only objects", () => {
		$.object().must_accept( {}, new Array, new Date, arguments )
			.must_reject_with( 'obj', Symbol(), 1, 'i' )
	} )

	it( "validates subschemas", () => {
		$.object( { x : $.integer(), y : $.integer() } )
			.must_accept(
				{ x : 1, y : 2 },
				{ x : 1, y : 2, z : 3 } )
			.must_reject_with( 'int', { x : 1, y : 'd', z : 3 } )
	} )

	it( "rejects absent values unless marked optional", () => {
		$.object().must_reject_with( 'opt', null, undefined )
		$.object().optional().must_accept( null, undefined )
	} )

	it( "enforces type()", () => {
		$.object().type( Date )
			.must_accept( new Date )
			.must_reject_with( 'obj.typ', [] )
	} )

	it( "enforces keys()", () => {
		$.object().keys( $.string().pattern( /^[a-z]{1,3}$/ ) )
			.must_accept( { h : null, i : Symbol(), j : 3 } )
			.must_reject_with( 'obj.key', { abcd : 1 } )
	} )

	it( "enforces vals()", () => {
		$.object().values( $.boolean().optional() )
			.must_accept( { a : true, b : false, c : null } )
			.must_reject_with( 'bul', { abcd : 1 } )
	} )

	it( "detects and rejects cycles", () => {
		const A = $.object()
		const B = $.object().values( A )

		assert.throws( () => A.values( B ) )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.object().optional( 1 ) )
		assert.throws( () => $.object().type() )
		assert.throws( () => $.object().type( 1 ) )
		assert.throws( () => $.object().type( {} ) )
		assert.throws( () => $.object().keys() )
		assert.throws( () => $.object().keys( 1 ) )
		assert.throws( () => $.object().keys( {} ) )
		assert.throws( () => $.object().values() )
		assert.throws( () => $.object().values( 1 ) )
		assert.throws( () => $.object().values( {} ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.object()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.type( Array ) )
			.must_clone_on( _ => _.keys( $.any() ) )
			.must_clone_on( _ => _.values( $.any() ) )
	} )
} )

describe( "struct()", () => {
	it( "constructs with a property maps", () => {
		$.struct()
		$.struct( {} )
		$.struct( { x : $.integer(), y : $.integer() } )
		assert.throws( () => $.struct( () => {} ) )
		assert.throws( () => $.struct( 1 ) )
	} )

	it( "accepts only objects with only enumerated properties", () => {
		for ( let scm of [ $.struct(), $.struct( {} ) ] )
			scm.must_reject_with( 'obj', Symbol(), 1, 'i', )
				.must_reject_with( 'obj.cls', { a : 1 } )

		$.struct( { x : $.integer(), y : $.integer() } )
			.must_accept( { x : 1, y : 2 } )
			.must_reject_with( 'obj.cls', { x : 1, y : 2, z : 3 } )
	} )

	it( "enforces type()", () => {
		function MyWidget () { this.a = 1 ; this.b = 2 }
		const big_widget = new MyWidget
		big_widget.c = 3

		$.struct( { a : $.number(), b : $.number() } ).type( MyWidget )
			.must_accept( new MyWidget )
			.must_reject_with( 'obj.cls', big_widget )
			.must_reject_with( 'obj.typ', { a : 1, b : 2 } )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.struct().optional( 1 ) )
		assert.throws( () => $.struct().type() )
		assert.throws( () => $.struct().type( 1 ) )
		assert.throws( () => $.struct().type( {} ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.struct()
			.must_clone_on( _ => _.optional() )
			.must_clone_on( _ => _.type( Array ) )
	} )
} )

describe( "literal()", () => {
	it( "constructs with a single literal value", () => {
		$.literal( 1 )
		$.literal( { a : 1 } )
		assert.throws( () => $.literal() )
		assert.throws( () => $.literal( 1, 2 ) )
	} )

	it( "accepts only the named value, with value semantics", () => {
		$.literal( 1 ).must_accept( 1 ).must_reject_with( 'lit', '1' )
		$.literal( { a : 1 } ).must_accept( { a : 1 } )
		$.literal( [ 1, 2 ] ).must_accept( [ 1, 2 ] )
		$.literal( Symbol() ).optional()
			.must_accept( null, undefined )
			.must_reject_with( 'lit', Symbol() )
		$.literal( NaN ).must_accept( NaN )
	} )

	it( "naming absent values selects for those specific values", () => {
		$.literal( null )
			.must_accept( null )
			.must_reject_with( 'lit', undefined )
		$.literal( undefined )
			.must_accept( undefined )
			.must_reject_with( 'lit', null )
		$.literal( null ).optional()
			.must_accept( null, undefined )
		$.literal( undefined ).optional()
			.must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.literal().optional( 1 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.literal( 1 ).must_clone_on( _ => _.optional() )
	} )
} )

describe( "enum()", () => {
	it( "constructs with a list of variants", () => {
		$.enum()
		$.enum( 1, 2, 3 )
		$.enum( [], Symbol(), 'g' )
	} )

	it( "accepts only values equal to one of those named", () => {
		$.enum().must_reject_with( 'enm', 1, {}, 'g' )
		$.enum( 5, 'g', { a : 1 } )
			.must_accept( 5, 'g', { a : 1 } )
			.must_reject_with( 'enm', 3, 'h', { a : 1, b : 2 } )
	} )

	it( "naming absent values selects for those specific values", () => {
		$.enum( null, 1 )
			.must_accept( null, 1 )
			.must_reject_with( 'enm', undefined )
		$.enum( undefined, 2 )
			.must_accept( undefined, 2 )
			.must_reject_with( 'enm', null )
		$.enum( null, 1 ).optional()
			.must_accept( null, undefined )
		$.enum( undefined, 1 ).optional()
			.must_accept( null, undefined )
	} )
} )

describe( "any_of()", () => {
	it( "construct with a list of subschemas", () => {
		$.any_of()
		$.any_of( $.any() )
		$.any_of( $.number(), $.string() )
		assert.throws( () => $.any_of( 1 ) )
	} )

	it( "accepts only values that match at least one subschema", () => {
		$.any_of(
			$.object({ a : $.integer() }),
			$.object({ b : $.integer() }),
			$.object({ c : $.integer() }) )
		.must_accept( { a : 1 }, { b : 1 }, { c : 1 }, { a : 1, b : 1 } )
		.must_reject_with( 'ano', { g : 5 }, null )
	} )

	it( "when marked optional, short-circuits on absents", () => {
		$.any_of(
			$.integer().gte( 100 ),
			$.literal( 'G' ) ).optional()
		.must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.any_of().optional( 2 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.any_of().must_clone_on( _ => _.optional() )
	} )
} )

describe( "all_of()", () => {
	it( "construct with a list of subschemas", () => {
		$.all_of()
		$.all_of( $.any() )
		$.all_of( $.number(), $.integer() )
		assert.throws( () => $.all_of( 1 ) )
	} )

	it( "accepts only values that match all subschemas", () => {
		$.all_of(
			$.object({ a : $.integer() }),
			$.object({ b : $.integer() }),
			$.object({ c : $.integer() }))
		.must_reject_with( 'opt,opt,opt', null, undefined )
		.must_reject_with( 'opt', { a : 1, b : 2 } )
		.must_reject_with( 'int', { a : 1, b : 'g', c : 3 } )
		.must_accept( { a : 1, b : 2, c : 3 } )
	} )

	it( "when marked optional, short-circuits on absents", () => {
		$.all_of(
			$.object({ a : $.integer() }),
			$.object({ b : $.integer() }),
			$.object({ c : $.integer() })).optional()
		.must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.all_of().optional( 2 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.all_of().must_clone_on( _ => _.optional() )
	} )
} )

describe( "one_of()", () => {
	it( "construct with a list of subschemas", () => {
		$.one_of()
		$.one_of( $.any() )
		$.one_of( $.number(), $.string() )
		assert.throws( () => $.one_of( 1 ) )
	} )

	it( "accepts only values that match exactly one subschema", () => {
		$.one_of(
			$.object({ a : $.integer() }),
			$.object({ b : $.integer() }),
			$.object({ c : $.integer() }))
		.must_reject_with( 'ono.non', null, undefined, {}, { g : 2 } )
		.must_accept( { a : 1 }, { b : 2 }, { c : 3 } )
		.must_reject_with( 'ono.mlt', { a : 1, b : 2 } )
	} )

	it( "when marked optional, short-circuits on absents", () => {
		$.one_of(
			$.object({ a : $.integer() }),
			$.object({ b : $.integer() }),
			$.object({ c : $.integer() })).optional()
		.must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.one_of().optional( 2 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.one_of().must_clone_on( _ => _.optional() )
	} )
} )

describe( "none_of()", () => {
	it( "construct with a list of subschemas", () => {
		$.none_of()
		$.none_of( $.any() )
		$.none_of( $.number(), $.string() )
		assert.throws( () => $.none_of( 1 ) )
	} )

	it( "accepts only values that match no subschema", () => {
		$.none_of(
			$.object({ x : $.integer() } ),
			$.string().length( 3 ),
			$.literal( null ) )
		.must_accept( { x : 't' }, 'g', undefined )
		.must_reject_with( 'nno', { x : 1 }, 'bbb', null )
	} )

	it( "when marked optional, short-circuits on absents", () => {
		$.none_of(
			$.literal( null ),
			$.literal( undefined ) ).optional()
		.must_accept( null, undefined )
	} )

	it( "refinements throw when passed invalid arguments", () => {
		assert.throws( () => $.none_of().optional( 2 ) )
	} )

	it( "refinements clone instead of mutating", () => {
		$.none_of().must_clone_on( _ => _.optional() )
	} )
} )

describe( 'rule()', () => {
	it( 'constructs with a test and optional context', () => {
		assert.throws( () => $.rule() )
		assert.throws( () => $.rule( 1 ) )
		$.rule( _ => true )
		$.rule( ( _ => true ), { a : 1 } )
	} )
	
	it( 'applies test and passes along context', () => {
		$.rule( _ => _ % 3 )
			.must_accept( 1, 2 )
			.must_reject_with( 'rul', 3, 6 )
		const ids = { A : 1, B : 2 }
		const in_map = $.rule( ( ( value, map ) => value in map ), ids )
		ids.C = 3
		in_map
			.must_accept( 'C' )
			.must_reject_with( 'rul', 'D' )
	} )
} )

describe( 'FSchema', () => {
	it( 'substitutes user-provided code', () => {
		$.string().pattern( /^[0-9]{5}$/ ).code( 'zip' )
			.must_accept( '12345' )
			.must_reject_with( 'zip', '1234', 'g', null )
	} )

	it( 'forbids naming a predefined code', () => {
		assert.throws( () => $.integer().code( 'opt' ) )
	} )

	it( 'throws on assert()', () => {
		assert.throws( () => $.integer().assert( 'g' ) )
	} )
} )
