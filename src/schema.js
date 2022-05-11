'use strict'
const SchemaValidation = require( './validation' )

module.exports = class Schema {

    static from ( spec ) {
        if ( spec === undefined )
            return new Schema
        if ( spec instanceof Schema )
            return spec
        if ( !( spec instanceof Function ) )
            throw new Error( "invalid schema specification" )
        const scm = spec( new Schema )
        if ( !( scm instanceof Schema ) )
            throw new Error( `builder ${spec} yielded non-Schema` )
        return scm
    }

    constructor () {}

    opt () {
        if ( arguments.length )
            throw new Error( "opt() doesn't take arguments" )
        if ( this._opt )
            throw new Error( "already marked optional" )
        this._opt = true
        return this
    }

    rule ( fn ) {
        if ( !( fn instanceof Function ) )
            throw new Error( "non-function rule" )
        if ( fn.length === 0 )
            throw new Error( "rule doesn't appear to use validation" )
        if ( !this._rul )
            this._rul = []
        this._rul.push( fn )
        return this
    }

    apply ( value, name, strings = null ) {
        const validation = new SchemaValidation( this, value, name, strings )
        if ( value === null || value === undefined )
            return this._opt
                ? validation.describe()
                : validation.add_error( 'opt' ).describe()
        this._check( validation )
        if ( !validation.ok() )
            return validation.describe()
        for ( let rule of this._rul || [] )
            rule( validation )
        return validation.describe()
    }

    _check ( validation ) {
        // no op
    }

    assert ( value, name, t9ns ) {
        const validation = this.apply( value, name, t9ns )
        if ( !validation.ok() )
            throw validation.as_error()
        return this
    }

}
