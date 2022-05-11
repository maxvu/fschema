'use strict'

module.exports = ( Schema ) => class SumSchema extends Schema {

    static shorthand = 'sum'

    constructor ( ...variants ) {
        super()
        if ( !variants.length )
            throw new Error( "no variants specified" )
        this._vrs = variants.map( Schema.from )
    }

    _check ( validation ) {
        const { value, name } = validation
        for ( let variant of this._vrs )
            if ( variant.apply( value, name ).ok() )
                return validation
        return validation.add_error( 'sum' )
    }

}
