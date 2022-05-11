'use strict'

module.exports = ( Schema ) => class BoolSchema extends Schema {

    static shorthand = 'bool'

    constructor () {
        super()
        if ( arguments.length )
            throw new Error( "bool() doesn't accept arguments" )
    }

    _check ( validation ) {
        const { value } = validation
        if ( typeof value !== 'boolean' )
            validation.add_error( 'bool' )
        return validation
    }

}
