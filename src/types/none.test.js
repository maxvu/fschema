'use strict'

describe( 'schema', function () {
describe( 'none()', function () {

    it( "rejects all values", function () {
        schema.none().assert_rejects( [] )
        schema.none().assert_rejects( 'hi' )
        schema.none().assert_rejects( true )
    } )

    it( "throws on constructor arguments", function () {
        assert.throws( () => schema.none( 1 ) )
        assert.throws( () => schema.none( true ) )
        assert.throws( () => schema.none( [] ) )
        assert.throws( () => schema.none( {} ) )
    } )

} )
} )
