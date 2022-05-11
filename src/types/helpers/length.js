'use strict'

const ERR_REDUNDANT = () => new Error( "redundant length specification" )
const ERR_BACKWARDS = () => new Error( "backwards length specification" )
const ERR_INVALID   = () => new Error( "invalid length specification" )

module.exports = {
    min : ( scm, min ) => {
        if ( scm._min )
            throw ERR_REDUNDANT()
        if ( typeof min !== 'number' || min < 0 )
            throw ERR_INVALID()
        if ( scm._max && min > scm._max )
            throw ERR_BACKWARDS()
        scm._min = min
        return scm
    },
    max : ( scm, max ) => {
        if ( scm._max )
            throw ERR_REDUNDANT()
        if ( typeof max !== 'number' || max < 0 )
            throw ERR_INVALID()
        if ( scm._min && max < scm._min )
            throw ERR_BACKWARDS()
        scm._max = max
        return scm
    },
    len : ( scm, len ) => {
        if ( scm._max || scm._min )
            throw ERR_REDUNDANT()
        if ( typeof len !== 'number' || len < 0 )
            throw ERR_INVALID()
        scm._max = scm._min = len
        return scm
    },
    check : ( scm, pfx, vld, path = _ => _.length ) => {
        const { value } = vld
        if ( scm._max >= 0 && scm._min >= 0 && scm._max === scm._min ) {
            if ( path( value ) !== scm._max )
                vld.add_error( `${pfx}.len`, scm._max )
        } else {
            if ( scm._max >= 0 && path( value ) > scm._max )
                vld.add_error( `${pfx}.max`, scm._max )
            else if ( scm._min >= 0 && path( value ) < scm._min )
                vld.add_error( `${pfx}.min`, scm._min )
        }
        return vld
    }
}
