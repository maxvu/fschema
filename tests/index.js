'use strict'
const strings = require( '../src/strings' )
const Schema  = require( '../src/schema' )

// Avoid having to require() in each test module.
global.schema = require( '../src/' )
global.assert = require( 'assert' )

// Test for validation failure. Optionally, further specify which specific
// code should be encountered and the name of the value it was triggered by.
Schema.prototype.assert_rejects = function ( value, code, name ) {
    const validation = this.apply( value )
    if ( validation.ok() ) {
        throw new Error( `schema accepts ${value} but shouldn't` )
    }

    const codes = () => validation.errors.map( _ => _.code ).join( ', ' )

    for ( let error of validation.errors )
        assert( error.message, `${error.code} is missing a message` )
    if ( code && !name ) {
        assert(
            validation.errors.some( _ => _.code === code ),
            `schema rejected, but with ${codes()} instead of ${code}`
        )
    }
    if ( code && name ) {
        assert(
            validation.errors.some( _ => _.code === code && _.name === name ),
            `schema rejected, but not with name/code ${name}/${code}`
        )
    }
}

// In testing, throw when a validation occurs but no human-readable string
// exists to describe it.
strings.THROW_ON_MISS = true
