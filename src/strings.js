'use strict'

const format = ( str, ...args ) => {
    for ( let i = 0; i < args.length; i++ )
        str = str.replace( `{${i}}`, args[ i ] )
    return str
}

const STRINGS = {
    'opt'           : "{0} must be present",
    'arr.type'      : "{0} must be an Array",
    'arr.min'       : "{0} must be at least size {1}",
    'arr.max'       : "{0} can be at most size {1}",
    'arr.len'       : "{0} must have size {1}",
    'bool'          : "{0} must be either true or false",
    'enum'          : "{0} must be one of { {1} }",
    'fun.type'      : "{0} must be a function",
    'fun.min'       : "{0} must have at least length {1}",
    'fun.max'       : "{0} must have at most length {1}",
    'fun.len'       : "{0} must have length {1}",
    'lit'           : "{0} must be exactly '{1}'",
    'none'          : "no values are accepted",
    'num.type'      : "{0} must be a primitive number",
    'num.int'       : "{0} must be an integer",
    'num.fin'       : "{0} must be finite",
    'num.min'       : "{0} must be greater than {1}",
    'num.max'       : "{0} must be less than {1}",
    'obj'           : "{0} must be an object",
    'obj.ctor'      : "{0} must be an instance of {1}",
    'obj.closed'    : "{0} must not have unenumerated property '{1}'",
    'obj.type'      : "{0} must be an instance of {1}",
    'obj.len'       : "{0} must have size {1}",
    'obj.min'       : "{0} must have size at least {1}",
    'obj.max'       : "{0} must have size at most {1}",
    'scm'           : "{0} must be a Schema",
    'str.type'      : "{0} must be a string",
    'str.min'       : "{0} must be at least length {1}",
    'str.max'       : "{0} must be at most length {1}",
    'str.len'       : "{0} must have length {1}",
    'str.pat'       : "{0} must match pattern {1}",
    'str.ascii'     : "{0} must be a printable-ASCII string",
    'str.slug'      : "{0} must be a URL slug",
    'str.ipv4'      : "{0} must be a valid IPv4 address",
    'str.ipv6'      : "{0} must be a valid IPv6 address",
    'str.date8601'  : "{0} must be a valid ISO 8601 date",
    'str.url'       : "{0} must be a valid URL",
    'sum'           : "{0} matched none of sum()",
    'tup.type'      : "{0} must be a {1}-tuple (array, length {1})"
}

const has = ( code ) => code in STRINGS

const get = ( code, ...args ) => {
    if ( !has( code ) ) {
        if ( module.exports.THROW_ON_MISS )
            throw new Error( `missing string for code ${code}` )
        return `[[missing code ${code}, with args ${args.join( ', ' )}`
    }
    return format( STRINGS[ code ], ...args )
}

module.exports = { has, get }
