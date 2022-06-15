'use strict'

describe( 'schema', function () {
describe( 'sum()', function () {

    const six_or_false = schema.sum(
        _ => _.lit( 6 ),
        _ => _.lit( false ) )
    const small_or_big = schema.sum(
        _ => _.num().min( 1 ).max( 9 ),
        _ => _.num().min( 100 ).max( 109 ) )

    it( "accepts with enumerated schemas", function () {
        six_or_false.assert( 6 )
        six_or_false.assert( false )
        small_or_big.assert( 5 )
        small_or_big.assert( 105 )
    } )

    it( "rejects all other values", function () {
        six_or_false.assert_rejects( {} )
        six_or_false.assert_rejects( [] )
        six_or_false.assert_rejects( 5 )
        six_or_false.assert_rejects( true )
        small_or_big.assert_rejects( [] )
        small_or_big.assert_rejects( {} )
        small_or_big.assert_rejects( null )
        small_or_big.assert_rejects( 77 )
    } )

    it( "throws when no variants given", function () {
        assert.throws( () => schema.sum() )
    } )

    it( "throws when non-Schema provided", function () {
        assert.throws( () => schema.sum( null ) )
        assert.throws( () => schema.sum( {} ) )
        assert.throws( () => schema.sum( _ => 5 ) )
    } )

} )
} )
