'use strict'
const types  = require( './types' )
const Schema = require( './schema' )

module.exports = ( () => {
    let seen = {}

    for ( let type of types ) {
        if ( !( type instanceof Function ) )
            throw new Error( "not a constructor" )

        type = type( Schema )
        if ( typeof type.shorthand !== 'string' )
            throw new Error( "no shorthand defined" )
        if ( type.shorthand in seen )
            throw new Error( `shorthand '${type.shorthand}' already used` )
        seen[ type.shorthand ] = 1
        if ( !( type.prototype._check instanceof Function ) )
            throw new Error( "no _check defined" )

        Schema.prototype[ type.shorthand ] = function ( ...args ) {
            return Object.assign( new type( ...args ), this )
        }

        Schema.from[ type.shorthand ] = ( ...args ) => new type( ...args )
    }

    return Schema.from
} )()
