'use strict'

describe( 'schema', function () {
describe( 'tup()', function () {

    const t1 = schema.tup(
        _ => _.num().nat(),
        _ => _.str().max( 10 )
    )

    const t2 = schema.tup(
        _ => _.bool(),
        _ => _.bool()
    )

    it( "accepts defined tuples", function () {
        t1.assert( [ 1, "test" ] )
        t1.assert( [ 5, "test" ] )
        t2.assert( [ false, true ] )
        t2.assert( [ true, false ] )
    } )

    it( "rejects all other values", function () {
        t1.assert_rejects( [ 1, null ], 'opt' )
        t1.assert_rejects( [ 1, {} ], 'str.type' )
        t1.assert_rejects( [ '1', '' ], 'num.type' )
        t1.assert_rejects( [ 1, 'abcdefghijklmnop' ], 'str.max' )
        t2.assert_rejects( [ 1, false ], 'bool' )
        t2.assert_rejects( [ null, false ], 'opt' )
    } )

    it( "accepts only arrays", function () {
        t1.assert_rejects( 1, 'tup.type' )
        t1.assert_rejects( {}, 'tup.type' )
    } )

    it( "throws when no members given", function () {
        assert.throws( () => schema.tup() )
    } )

    it( "throws when non-Schema provided", function () {
        assert.throws( () => schema.tup( _ => 'hi' ) )
    } )

} )
} )
