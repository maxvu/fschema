'use strict'

describe( 'schema', function () {
describe( 'bool()', function () {

    it( "accepts booleans", function () {
        schema.bool().assert( true )
        schema.bool().assert( false )
    } )

    it( "rejects non-booleans", function () {
        for ( let v of [ 1, [], {}, NaN ] )
            schema.bool().assert_rejects( v, 'bool' )
    } )

    it( "throws on constructor arguments", function () {
        assert.throws( () => schema.bool( 1 ) )
        assert.throws( () => schema.bool( [] ) )
    } )

} )
} )
