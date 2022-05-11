'use strict'

module.exports = ( Schema ) => class TupleSchema extends Schema {

    static shorthand = 'tup'

    constructor ( ...items ) {
        super()
        if ( !items.length )
            throw new Error( "no members specified" )
        this._its = items.map( Schema.from )
    }

    _check ( validation ) {
        const { value, name } = validation
        if ( !( value instanceof Array ) )
            return validation.add_error( 'tup.type', this._its.length )
        for ( const [ i, scm ] of this._its.entries() )
            validation.subsume( scm.apply( value[ i ], `${name}[${i}]` ) )
        return validation
    }

}
