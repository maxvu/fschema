'use strict'

describe( 'schema', function () {
describe( 'fun()', function () {

    it( "accepts functions", function () {
        schema.fun().assert( () => {} )
        schema.fun().assert( function () {} )
    } )

    it( "rejects non-functions", function () {
        schema.fun().assert_rejects( 2, 'fun.type' )
        schema.fun().assert_rejects( {}, 'fun.type' )
        schema.fun().assert_rejects( [], 'fun.type' )
        schema.fun().assert_rejects( 'hi', 'fun.type' )
    } )

    it( "validates length with min()/max()/len()", function () {
        const f = schema.fun().min( 1 ).max( 3 )
        f.assert_rejects( () => {}, 'fun.min' )
        f.assert( ( a ) => a )
        f.assert( ( a, b ) => a )
        f.assert( ( a, b, c ) => a )
        f.assert_rejects( ( ( a, b, c, d ) => a ), 'fun.max' )

        const g = schema.fun().len( 2 )
        g.assert_rejects( ( a => a ), 'fun.len' )
    } )

    it( "throws on constructor arguments", function () {
        assert.throws( () => schema.fun( 1 ) )
        assert.throws( () => schema.fun( {} ) )
        assert.throws( () => schema.fun( 'hi' ) )
        assert.throws( () => schema.fun( () => {} ) )
    } )

} )
} )
