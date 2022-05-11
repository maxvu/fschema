'use strict'
const ALLOWED_TYPES = {
    number  : 1,
    string  : 1,
    boolean : 1
}

module.exports = ( Schema ) => class LiteralSchema extends Schema {

    static shorthand = 'lit'

    constructor ( val ) {
        super()
        if ( val === null || val === undefined )
            throw new Error( "use opt() to control for null and undefined" )
        if ( !( typeof val in ALLOWED_TYPES ) )
            throw new Error( "only primitive values allowed in lit()" )
        if ( Number.isNaN( val ) )
            throw new Error( "NaN is not allowed" )
        this._lit = val
    }

    _check ( validation ) {
        const { value } = validation
        if ( value !== this._lit )
            validation.add_error( 'lit' )
        return validation
    }

}
