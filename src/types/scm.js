'use strict'

module.exports = ( Schema ) => class SchemaSchema extends Schema {

    static shorthand = 'scm'

    constructor () {
        super()
        if ( arguments.length )
            throw new Error( "scm() doesn't accept arguments" )
    }

    _check ( validation ) {
        const { value } = validation
        if ( !( value instanceof Schema ) )
            validation.add_error( 'scm' )
        return validation
    }

}
