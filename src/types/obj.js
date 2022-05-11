'use strict'
const length_impl = require( './helpers/length' )

module.exports = ( Schema ) => class ObjectSchema extends Schema {

    static shorthand = 'obj'

    constructor ( props = null ) {
        super()
        if ( props && typeof props === 'object' )
            this.keys( props )
    }

    keys ( props ) {
        if ( this._prp )
            throw new Error( "redundant keys() specification" )
        this._prp = {}
        for ( let k of Object.keys( props ) )
            this._prp[ k ] = Schema.from( props[ k ] )
        return this
    }

    type ( ctor ) {
        if ( this._typ )
            throw new Error( "redundant type() specification" )
        if ( !ctor || !( ctor instanceof Function ) )
            throw new Error( "invalid type() specification" )
        this._typ = ctor
        return this
    }

    closed () {
        if ( arguments.length )
            throw new Error( "closed() doesn't accept arguments" )
        if ( this._clo )
            throw new Error( "redundant closed() specification" )
        this._clo = true
        return this
    }

    min ( min ) { return length_impl.min( this, min ) }
    max ( max ) { return length_impl.max( this, max ) }
    len ( len ) { return length_impl.len( this, len ) }

    _check ( validation ) {
        const { value, name } = validation
        if ( typeof value !== 'object' )
            return validation.add_error( 'obj.type' )
        if ( this._typ && !( value instanceof this._typ ) )
            validation.add_error( 'obj.ctor', this._typ.name )
        length_impl.check( this, 'obj',
            validation, _ => Object.keys( _ ).length )
        for ( let k in this._prp || {} ) {
            validation.subsume(
                this._prp[ k ].apply( value[ k ], `${name}.${k}` )
            )
        }
        if ( this._clo )
            for ( let k in value )
                if ( !( k in ( this._prp || {} ) ) )
                    validation.add_error( 'obj.closed', k )
        return validation
    }

}
