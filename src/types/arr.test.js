'use strict'

describe( 'schema', function () {
describe( 'arr()', function () {

    it( "accepts arrays", function () {
        for ( let v of [ [], [ 1 ], [ [ [ 1 ] ] ] ] )
            schema.arr().assert( v )
    } )

    it( "rejects non-arrays", function () {
        for ( let v of [ 1, NaN, {}, 'hi' ] )
            schema.arr().opt().assert_rejects( v, 'arr.type' )
    } )

    it( "properly recurses to array item values", function () {
        const scm = schema.arr().of( _ => _.num().int() )
        scm.assert( [ 1, 2 ] )
        scm.assert_rejects( [ 1, 'hi' ], 'num.type', 'value[1]' )
    } )

    it( "calls of() on construction", function () {
        const scm = schema.arr( _ => _.num().int() )
        scm.assert( [ 1, 2 ] )
        scm.assert_rejects( [ 1, 'hi' ], 'num.type', 'value[1]' )
    } )

    it( "refuses to let of() be called twice", function () {
        assert.throws( () => schema.arr( _ => _.num() ).of( _ => _.num() ) )
    } )

    it( "throws on bad of() call", function () {
        assert.throws( () => schema.arr( 'hello' ) )
        assert.throws( () => schema.arr( _ => 2 ) )
    } )

    it( "validates length with min()/max()/len()", function () {
        const a = schema().arr().min( 1 ).max( 3 )
        const b = schema().arr().len( 2 )

        a.assert_rejects( [], 'arr.min' )
        a.assert( [ 1 ] )
        a.assert( [ 1, 2 ] )
        a.assert( [ 1, 2, 3 ] )
        a.assert_rejects( [ 1, 2, 3, 4 ], 'arr.max' )

        b.assert_rejects( [ 1 ], 'arr.len' )
        b.assert( [ 1, 2 ] )
        b.assert_rejects( [ 1, 2, 3 ], 'arr.len' )
    } )

} )
} )
