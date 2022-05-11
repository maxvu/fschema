'use strict'

const assert_is_bound = ( x ) => {
    if ( typeof x !== 'number' || Number.isNaN( x ) )
        throw new Error( "invalid numeric bound" )
}

const assert_bound_direction = ( scm ) => {
    if ( !scm._min || !scm._max )
        return
    if ( scm._min > scm._max )
        throw new Error( "backwards numeric bound" )
    if ( scm._min === scm._max )
        throw new Error( "for an exact number, use lit()" )
}

module.exports = ( Schema ) => class NumberSchema extends Schema {

    static shorthand = 'num'

    constructor () {
        super()
    }

    min ( min ) {
        if ( this._min )
            throw new Error( "redundant min() specification" )
        assert_is_bound( min )
        this._min = min
        assert_bound_direction( this )
        return this
    }

    max ( max ) {
        if ( this._max )
            throw new Error( "redundant max() specification" )
        assert_is_bound( max )
        this._max = max
        assert_bound_direction( this )
        return this
    }

    int () {
        if ( arguments.length )
            throw new Error( "int() doesn't accept arguments" )
        if ( this._int )
            throw new Error( "redundant int() specification" )
        this._int = true
        return this
    }

    fin () {
        if ( arguments.length )
            throw new Error( "fin() doesn't accept arguments" )
        if ( this._fin )
            throw new Error( "redundant fin() specification" )
        this._fin = true
        return this
    }

    nat () {
        if ( arguments.length )
            throw new Error( "nat() doesn't accept arguments" )
        return this.min( 0 ).int()
    }

    _check ( validation ) {
        const { value } = validation
        if ( typeof value !== 'number' )
            return validation.add_error( 'num.type' )
        if ( this._max !== undefined && value > this._max )
            validation.add_error( 'num.max', this._max )
        if ( this._min !== undefined && value < this._min )
            validation.add_error( 'num.min', this._min )
        if ( this._fin && !Number.isFinite( value ) )
            validation.add_error( 'num.fin' )
        if ( this._int && !Number.isSafeInteger( value ) )
            validation.add_error( 'num.int' )
        return validation
    }

}
