'use strict'

describe( 'schema', function () {
describe( 'enum()', function () {

    const statuses = () => schema.enum( 'open', 'closed', 'pending' )

    it( "accepts enumerated variants", function () {
        statuses().assert( 'open' )
        statuses().assert( 'closed' )
        statuses().assert( 'pending' )
    } )

    it( "rejects unenumerated variants", function () {
        statuses().assert_rejects( 'blocked', 'enum' )
        statuses().assert_rejects( 43, 'enum' )
    } )

    it( "throws when no variants given", function () {
        assert.throws( () => schema.enum() )
    } )

    it( "throws on null, undefined or NaN", function () {
        assert.throws( () => schema.enum( 1, 2, null ) )
        assert.throws( () => schema.enum( 1, 2, NaN ) )
        assert.throws( () => schema.enum( 1, 2, undefined ) )
    } )

    it( "throws on non-primitives", function () {
        assert.throws( () => schema.enum( 1, 2, {} ) )
        assert.throws( () => schema.enum( 1, 2, [] ) )
    } )

    it( "throws on duplicate variants", function () {
        assert.throws( () => schema.enum( 1, 2, 1 ) )
    } )

} )
} )
