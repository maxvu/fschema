'use strict'
const DEFAULT_STRINGS = require( './strings' )

module.exports = class SchemaValidation {
    constructor ( schema, value, name ) {
        this.schema = schema
        this.errors = []
        this.value = value
        this.name = name || 'value'
    }

    add_error ( code, ...args ) {
        this.errors.push( {
            schema  : this.schema,
            value   : this.value,
            name    : this.name,
            code    : code,
            args    : args
        } )
        return this
    }

    subsume ( that ) {
        for ( const err of that.errors )
            this.errors.push( err )
        return this
    }

    describe ( strings ) {
        strings = strings || DEFAULT_STRINGS
        if ( !( strings.get instanceof Function ) )
            throw new Error( "unsuitable strings map" )
        for ( let err of this.errors )
            if ( !err.message ) {
                err.message = strings.get( err.code, err.name, ...err.args )
                delete err.args
            }
        return this
    }

    ok () {
        return !this.errors.length
    }

    as_error () {
        if ( this.ok() )
            return null
        const n = this.errors.length
        const e0 = this.errors[ 0 ]
        const err = new Error( n === 1
            ? e0.message
            : `${e0.message} (+ ${n - 1} more)` )
        err.messages = this.errors.map( _ => _.message )
        return err
    }
}
