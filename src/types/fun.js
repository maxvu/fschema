'use strict'
const length_impl = require( './helpers/length' )

module.exports = ( Schema ) => class FunctionSchema extends Schema {

    static shorthand = 'fun'

    constructor () {
        super()
        if ( arguments.length )
            throw new Error( "fun() doesn't accept arguments" )
    }

    min ( min ) {
        return length_impl.min( this, min )
    }

    max ( max ) {
        return length_impl.max( this, max )
    }

    len ( len ) {
        return length_impl.len( this, len )
    }

    _check ( validation ) {
        const { value } = validation
        if ( !( value instanceof Function ) )
            validation.add_error( 'fun.type' )
        length_impl.check( this, 'fun', validation )
        return validation
    }

}
