'use strict'

describe( 'schema', function () {
describe( 'str()', function () {

    it( "accepts strings", function () {
        schema.str().assert( 'hi' )
    } )

    it( "rejects non-strings", function () {
        for ( let v of [ 1, [], {}, false ] )
            schema.str().assert_rejects( v )
    } )

    it( "throws on constructor arguments", function () {
        assert.throws( () => schema.str( 1 ) )
        assert.throws( () => schema.str( {} ) )
        assert.throws( () => schema.str( [] ) )
    } )

    it( "validates length with min()/max()/len()", function () {
        const s1 = schema().str().min( 1 ).max( 3 )

        s1.assert_rejects( '', 'str.min' )
        s1.assert( 'a' )
        s1.assert( 'ab' )
        s1.assert( 'abc' )
        s1.assert_rejects( 'abcd', 'str.max' )

        const s2 = schema().str().len( 2 )
        s2.assert_rejects( '', 'str.len' )
        s2.assert_rejects( 'a', 'str.len' )
        s2.assert( 'ab', 'str.len' )
        s2.assert_rejects( 'abc', 'str.len' )
    } )

    it( "matches patterns with pat()", function () {
        const p = schema.str().pat( /abc/ )
        p.assert( 'sabc' )
        p.assert_rejects( 'abx', 'str.pat' )
    } )

    it( "throws on redundant pat() call", function () {
        assert.throws( () => schema.str().pat( /abc/ ).pat( /abc/ ) )
    } )

    it( "throws on when pat()'s given non-RegExp", function () {
        assert.throws( () => schema.str().pat( null ) )
        assert.throws( () => schema.str().pat( {} ) )
    } )

    it( "matches against ASCII", function () {
        const p = schema.str().ascii()
        p.assert( `print @$C!! []{}\\|test` )
        p.assert_rejects( `🙅🏻‍♂️`, 'str.ascii' )
    } )

    it( "matches against slugs", function () {
        const s = schema.str().slug()
        s.assert( 'singleword' )
        s.assert( 'here-a-valid-slug' )
        s.assert_rejects( 'UPPERCASE', 'str.slug' )
        s.assert_rejects( '-begins-with-dash', 'str.slug' )
        s.assert_rejects( 'has spaces', 'str.slug' )
        s.assert_rejects( 'has--double-dash', 'str.slug' )
        s.assert_rejects( '0begins-with-number', 'str.slug' )
    } )

    it( "matches against ISO 8601 dates", function () {
        const d = schema.str().date8601()
        d.assert( '2007-06-21' ) // valid
        d.assert( '2033-09-23' ) // valid
        d.assert_rejects( 'YYYY-MM-DD', 'str.date8601' ) // bad pattern match
        d.assert_rejects( '0000-00-00', 'str.date8601' ) // invalid m+d
        d.assert_rejects( '2011-02-29', 'str.date8601' ) // not a leap year
    } )

    it( "matches against IPv4 addresses", function () {
        const ip = schema.str().ipv4()
        ip.assert( '127.0.0.1' )
        ip.assert( '0.0.0.0' )
        ip.assert_rejects( '127.000.000.001', 'str.ipv4' )
        ip.assert_rejects( '127.0.0.1/24', 'str.ipv4' )
        ip.assert_rejects( 'fhqwhgads', 'str.ipv4' )
    } )

    it( "matches against IPv6 addresses", function () {
        const ip = schema.str().ipv6()
        ip.assert( '::1' )
        ip.assert( '4026:0991:cf4d:0000:0001:b28a:0615:7229' )
        ip.assert_rejects( 'fhqwhgads', 'str.ipv6' )
    } )

    it( "matches against URLs", function () {
        const bad_cases = [
            '../',
            'http://',
            'http//',
            'website .com'
        ]

        const good_cases = [
            'htp://www',
            'http://website.com',
            'http://website.com:9999'
        ]

        const u = schema.str().url()
        for ( let cse of bad_cases )
            u.assert_rejects( cse, 'str.url' )
        for ( let cse of good_cases )
            u.assert( cse )
    } )

    it( 'lets pat only be set once', function () {
        assert.throws( () => schema.str().pat( /abc/ ).ascii() )
    } )

    it( 'throws when predefined patterns invoked with args', function () {
        assert.throws( () => schema.str().ascii( 123 ) )
        assert.throws( () => schema.str().ipv4( 123 ) )
    } )

} )
} )
