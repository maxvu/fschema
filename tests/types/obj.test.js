'use strict'

describe( 'schema', function () {
describe( 'obj()', function () {

    it( "accepts objects", function () {
        schema.obj().assert( {} )
        schema.obj().assert( { one : 1 } )
        schema.obj().assert( Buffer.from( 'hi' ) )
    } )

    it( "rejects non-objects", function () {
        schema.obj().assert_rejects( 'hi' )
        schema.obj().assert_rejects( 2.2 )
        schema.obj().assert_rejects( false )
    } )

    it( "rejects null", function () {
        schema.obj().assert_rejects( null )
    } )

    it( "validates properties with keys()", function () {
        const o = schema.obj().keys({
            one : _ => _.lit( 1 ),
            num : _ => _.num()
        })
        o.assert( { one : 1, num : 2 } )
        o.assert_rejects( { one : 1 }, 'opt' )
        o.assert_rejects( { one : 2, num : 2 }, 'lit' )
        o.assert_rejects( 2, 'obj.type' )
    } )

    it( "accepts keys() from constructor", function () {
        const o = schema.obj({
            one : _ => _.lit( 1 )
        })
        o.assert( { one : 1, two : 2 } )
    } )

    it( "throws on redundant calls to keys()", function () {
        assert.throws( () => schema.obj({}).keys({}) )
    } )

    it( "validates constructor with type()", function () {
        function Thing () {}
        const o = schema.obj().type( Thing )
        o.assert( new Thing )
        o.assert_rejects( {}, 'obj.ctor' )
    } )

    it( 'throws on multiple calls to type()', function () {
        assert.throws( () => schema.obj().type( Array ).type( Array ) )
    } )

    it( 'throws on non-function argument to ctor()', function () {
        assert.throws( () => schema.obj().type( 1 ) )
    } )

    it( "validates closedness with closed()", function () {
        const o = schema.obj({ one : _ => _.lit( 1 ) }).closed()
        o.assert_rejects({ one : 1, two : 2 }, 'obj.closed' )
    } )

    it( "throws on closed() arguments", function () {
        assert.throws( () => schema.obj().closed( 1 ) )
    } )

    it( "throws on multiple calls to closed()", function () {
        assert.throws( () => schema.obj().closed().closed() )
    } )

    it( "validates length with min()/max()/len()", function () {
        const [ x, y, z ] = [ 77, 88, 99 ]
        const oa = schema.obj().len( 2 )
        oa.assert_rejects( { x }, 'obj.len' )
        oa.assert( { x, y } )
        oa.assert_rejects( { x, y, z } )

        const ob = schema.obj().min( 1 ).max( 2 )
        ob.assert_rejects( {}, 'obj.min' )
        ob.assert( { x } )
        ob.assert( { x, y } )
        ob.assert_rejects( { x, y, z }, 'obj.max' )

    } )

} )
} )
