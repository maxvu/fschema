'use strict'

let FSchema = module.exports = {}

// Enum and Literal types use value semantics.
export function deep_equal ( a, b ) {
	let ka, kb, oa, ob ;
	if ( a === b || ( Number.isNaN( a ) && Number.isNaN( b ) ) )
		return a === b
	oa = typeof a === 'object' && a !== null
	ob = typeof b === 'object' && b !== null
	if ( oa !== ob ) return false
	if ( !oa ) return false
	ka = Object.keys( a )
	kb = Object.keys( b )
	if ( ka.length !== kb.length ) return false
	for ( let k of ka ) {
		if ( !( k in b ) )
			return false
		if ( !deep_equal( a[ k ], b[ k ] ) )
			return false
	}
	return true
}

const klass = ({ export, constructor, methods, parent = null }) => {
	constructor.prototype = Object.assign(
		parent ? Object.create( parent.prototype ) : null,
		methods )
	constructor.parent = parent
	if ( export )
		module.exports[ export ] = constructor
	return constructor
}

function Violation ( value, name, code, args ) {
	Object.assign( this, { value, name, code, args } )
}

const Validation = klass({
	parent : Array,
	constructor : function Validation ( value, name, strings, root = null ) {
		if ( name == null )
			name = 'value'
		if ( root && !( root instanceof Validation ) )

		this._val = value
		this._nam = name
		this._str = strings
		this._rut = root
	},
	methods : {
		value : function () { return this._val },
		name  : function () { return this._nam },
		present : function () { return this._val == null },
		ok : function () { return !this.length },
		messages : function () {},
		record_error : function () {},
	}
})

const FVal = klass({
	constructor : function FVal () {},
	methods : {
		clone : function ( props ) {
			return Object.assign(
				Object.create( Object.getPrototypeOf( this ) ),
				this,
				props )
		},
		name : function ( name ) {},
		accepts : function ( value ) {},
		rejects : function ( value ) {},
		assert : function ( value ) {},
		references : function ( that ) {},
		validate : function ( value, name, strings ) {

		},
	}
})

const FNone = klass({
	export : 'none',
	constructor : function FNone () {
		if ( arguments.length )
			throw new Error( "none() accepts no arguments" )
		FNone.parent.call( this )
	},
	methods : {
		validate : function ( ...args ) {

		}
	}
})

