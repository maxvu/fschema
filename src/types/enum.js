'use strict'
const ALLOWED_TYPES = {
    number  : 1,
    string  : 1,
    boolean : 1
}

module.exports = ( Schema ) => class EnumSchema extends Schema {

    static shorthand = 'enum'

    constructor ( ...variants ) {
        super()
        if ( !variants.length )
            throw new Error( "no variants specified" )
        const seen = {}
        for ( const variant of variants ) {
            if ( variant === null || variant === undefined )
                throw new Error( "use opt() to control for null and undefined" )
            if ( !( typeof variant in ALLOWED_TYPES ) )
                throw new Error( "only primitives allowed in enum()" )
            if ( Number.isNaN( variant ) )
                throw new Error( "NaN not allowed" )
            if ( variant in seen )
                throw new Error( `duplicate enum() variant '${variant}'` )
            seen[ variant ] = 1
        }
        this._vrn = seen
    }

    _check ( validation ) {
        const { value } = validation
        const allowed_type = typeof value in ALLOWED_TYPES
        const is_member = value in this._vrn
        if ( !allowed_type || !is_member ) {
            const variants = Object.keys( this._vrn ).sort().join( ', ' )
            validation.add_error( 'enum', variants )
        }
        return validation
    }

}
