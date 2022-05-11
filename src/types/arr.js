'use strict'
const length_impl = require( './helpers/length' )

module.exports = ( Schema ) => class ArraySchema extends Schema {

    static shorthand = 'arr'

    constructor ( item_schema ) {
        super()
        if ( item_schema )
            this.of( item_schema )
    }

    of ( item_schema ) {
        if ( this._itm )
            throw new Error( "of() already specified" )
        this._itm = Schema.from( item_schema )
        return this
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
        const { value, name } = validation
        if ( !( value instanceof Array ) )
            return validation.add_error( 'arr.type' )
        length_impl.check( this, 'arr', validation )
        if ( this._itm )
            for ( let [ i, item ] of value.entries() )
                validation.subsume( this._itm.apply( item, `${name}[${i}]` ) )
        return validation
    }

}
