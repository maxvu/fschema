'use strict'
module.exports = ( Schema ) => class NoneSchema extends Schema {

    static shorthand = 'none'

    constructor () {
        super()
        if ( arguments.length )
            throw new Error( "none() doesn't accept arguments" )
    }

    _check ( validation ) {
        const { value } = validation
        validation.add_error( 'none' )
        return validation
    }

}
