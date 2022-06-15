'use strict'

describe( 'schema', function () {

    it( "exports as a function", function () {
        assert( typeof schema === 'function' )
    } )

    it( "exposes shorthand functions as properties", function () {
        for ( let typ of [ 'arr', 'num', 'tup' ] )
            assert( typeof schema[ typ ] === 'function' )
    } )

    it( "constructs with no arguments", function () {
        assert( typeof schema().opt === 'function' )
    } )

    it( "pass-through constructs with Schema arguments", function () {
        assert( typeof schema( schema.arr() ).len === 'function' )
    } )

    it( "constructs with a valid builder function", function () {
        assert( typeof schema( _ => _.arr() ).len === 'function' )
    } )

    it( "fails to construct with strange arguments", function () {
        for ( let v of [ NaN, false, 22 ] )
            assert.throws( () => schema( v ) )
    } )

    it( "marks optionality with opt()", function () {
        schema().assert( 1 )
        schema().assert_rejects( null, 'opt' )
        schema().assert_rejects( undefined, 'opt' )
        const o = schema.num().min( 6 ).max( 10 ).opt()
        o.assert( null )
        o.assert( undefined )
    } )

    it( "allows for user rules with rule()", function () {
        const scm = schema().rule( ( vld ) => {
            if ( typeof vld.value !== 'boolean' )
                vld.add_error( 'bool' )
        } )
        scm.assert( true )
        scm.assert_rejects( 2, 'bool' )
    } )

    it( "throws when non-function given to rule", function () {
        for ( let v of [ undefined, null, NaN, 2 ] )
            assert.throws( () => schema().rule( v ) )
    } )

    it( "returns a validation with apply()", function () {
        const vld = schema( _ => _.num() ).apply( true )
        assert( vld.errors instanceof Array )
    } )

    it( "throws on bad validation with assert()", function () {
        assert.throws( () => schema( _ => _.num() ).assert( true ) )
    } )

} )
