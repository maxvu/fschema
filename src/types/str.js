'use strict'
const length_impl = require( './helpers/length' )
const net = require( 'net' )

module.exports = ( Schema ) => {

    const patterns = {
        ascii    : {
            code    : 'str.ascii',
            pattern : /^[\x20-\x7E]*$/
        },
        slug     : {
            code    : 'str.slug',
            pattern : /^[a-z]+(-[a-z0-9]+)*$/
        },
        date8601 : {
            code    : 'str.date8601',
            pattern : /^\d{4}-\d{2}-\d{2}$/,
            handler : ( v ) => {
                const [ y, m, d ] = v.split( '-' ).map( _ => +_ )
                const d_max = new Date( y, m, 0 ).getDate()
                return m >= 1 && m <= 12 && d >= 1 && d <= d_max
            }
        },
        ipv4     : {
            code    : 'str.ipv4',
            handler : net.isIPv4
        },
        ipv6     : {
            code    : 'str.ipv6',
            handler : net.isIPv6
        },
        url      : {
            code    : 'str.url',
            handler : ( v ) => {
                try { new URL( v ) } catch { return false }
                return true
            }
        }
    }

    class StringSchema extends Schema {

        static shorthand = 'str'

        constructor () {
            super()
            if ( arguments.length )
                throw new Error( "str() doesn't accept arguments" )
        }

        min ( min ) { return length_impl.min( this, min ) }
        max ( max ) { return length_impl.max( this, max ) }
        len ( len ) { return length_impl.len( this, len ) }

        pat ( regex ) {
            if ( this._pat )
                throw new Error( "redundant pattern specification" )
            if ( !( regex instanceof RegExp ) )
                throw new Error( "invalid string pattern" )
            this._pat = regex
            return this
        }

        _check ( validation ) {
            const { value } = validation
            if ( typeof value !== 'string' )
                validation.add_error( 'str.type' )
            length_impl.check( this, 'str', validation )
            if ( this._pat instanceof RegExp && !value.match( this._pat ) )
                validation.add_error( 'str.pat', this._pat )
            else if ( this._pat && this._pat in patterns ) {
                const cur = patterns[ this._pat ]
                const err = () => validation.add_error( cur.code )
                if ( cur.pattern && !value.match( cur.pattern ) )
                    err()
                else if ( cur.handler && !cur.handler( value ) )
                    err()
            }
            return validation
        }
    }

    for ( let ref in patterns ) {
        StringSchema.prototype[ ref ] = function () {
            if ( arguments.length )
                throw new Error( `${ref}() doesn't accept arguments` )
            if ( this._pat )
                throw new Error( "redundant pattern specification" )
            this._pat = ref
            return this
        }
    }

    return StringSchema

}
