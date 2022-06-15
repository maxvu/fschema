'use strict'

describe( 'schema', function () {
describe( 'lit()', function () {

    const two = schema.lit( 2 )

    it( "accepts named literals", function () {
        two.assert( 2 )
    } )

    it( "rejects all other values", function () {
        two.assert_rejects( 3, 'lit' )
        two.assert_rejects( 'hi', 'lit' )
        two.assert_rejects( true, 'lit' )
    } )

    it( "throws on null, undefined or NaN", function () {
        assert.throws( () => schema.lit( null ) )
        assert.throws( () => schema.lit() )
        assert.throws( () => schema.lit( NaN ) )
        assert.throws( () => schema.lit( undefined  ) )
    } )

    it( "throws on non-primitive values", function () {
        for ( let v of [ [], {} ] )
            assert.throws( () => schema.lit( v ) )
    } )

} )
} )
