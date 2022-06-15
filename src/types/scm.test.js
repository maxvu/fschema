'use strict'

describe( 'schema', function () {
describe( 'scm()', function () {

    it( "accepts schemas", function () {
        schema.scm().assert( schema() )
        schema.scm().assert( schema.num() )
        schema.scm().assert( schema.lit(  5 ) )
    } )

    it( "rejects non-schemas", function () {
        schema.scm().assert_rejects( 1 )
        schema.scm().assert_rejects( {} )
        schema.scm().assert_rejects( [] )
        schema.scm().assert_rejects( NaN )
    } )

    it( "throws on constructor arguments", function () {
        assert.throws( () => schema.scm( 1 ) )
        assert.throws( () => schema.scm( [] ) )
        assert.throws( () => schema.scm( {} ) )
    } )

} )
} )
