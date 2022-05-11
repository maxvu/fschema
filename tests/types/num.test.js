'use strict'

describe( 'schema', function () {
describe( 'num()', function () {

    const nums = schema().num()
    const ints = schema().num().int()

    it( "accepts numbers", function () {
        nums.assert( -Infinity )
        nums.assert( Infinity )
        nums.assert( NaN )
        nums.assert( -0 )
        nums.assert( 22 )
        nums.assert( 3.697296376497268e+197 )
    } )

    it( "rejects non-numbers", function () {
        for ( let v of [ [], {}, 'hi', () => {} ] )
            nums.assert_rejects( v, 'num.type' )
    } )

    it( "bounds with min()/max()", function () {
        const n = schema().num().min( 2 ).max( 4 )
        n.assert( 2 )
        n.assert( 2.21 )
        n.assert( 4 )
        n.assert_rejects( 1, 'num.min' )
        n.assert_rejects( 4.1, 'num.max' )
    } )

    it( "throws on redundant min()/max()", function () {
        assert.throws( () => schema.num().min( 5 ).min( 5 ) )
        assert.throws( () => schema.num().max( 5 ).max( 9 ) )
    } )

    it( "throws on backwards min()/max()", function () {
        assert.throws( () => schema.num().min( 99 ).max( 55 ) )
    } )

    it( "throws on non-numeric min()/max()", function () {
        assert.throws( () => schema.num().min( {} ) )
        assert.throws( () => schema.num().min( NaN ) )
    } )

    it( "throws on exact bound", function () {
        assert.throws( () => schema.num().min( 2 ).max( 2 ) )
    } )

    it( "validates safe integers with int()", function () {
        const i = schema.num().int()
        i.assert( -1 )
        i.assert( Number.MAX_SAFE_INTEGER )
        i.assert_rejects( 1.1, 'num.int' )
        i.assert_rejects( Number.MAX_SAFE_INTEGER + 1, 'num.int' )
    } )

    it( "throws on redundant int()", function () {
        assert.throws( () => schema.num().int().int() )
    } )

    it( "throws on int() arguments", function () {
        assert.throws( () => schema.num().int( 1 ) )
    } )

    it( "validates finiteness with fin()", function () {
        const f = schema().num().fin()
        f.assert( -5.71465326043293e+103 )
        f.assert( 8 )
        f.assert_rejects( NaN, 'num.fin' )
        f.assert_rejects( -Infinity, 'num.fin' )
        f.assert_rejects( Infinity, 'num.fin' )
    } )

    it( "throws on fin() arguments", function () {
        assert.throws( () => schema.num().fin( 1 ) )
    } )

    it( "throws on redundant fin()", function () {
        assert.throws( () => schema.num().fin().fin() )
    } )

    it( "validates naturalness with nat()", function () {
        const n = schema().num().nat()
        n.assert( 0 )
        n.assert( 1 )
        n.assert_rejects( Infinity, 'num.int' )
        n.assert_rejects( NaN, 'num.int' )
        n.assert_rejects( -1, 'num.min' )
    } )

    it( "throws on nat() arguments", function () {
        assert.throws( () => schema.num().nat( 2 ) )
    } )

    it( "throws on redundant nat()", function () {
        assert.throws( () => schema.num().nat().nat() )
    } )

} )
} )
