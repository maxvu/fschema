import { describe, test } from "node:test"
import * as assert from "assert"
import * as impl from './fschema.js'

describe( "Violation", () => {

	test( "accepts well-formed inputs", () => new impl.Violation({
		value : undefined,
		name  : "some-value",
		code  : "some-err",
		args  : []
	}) )

	test( "rejects non-objects", () => {} )
	test( "rejects spec with missing value", () => {} )
	test( "rejects non-string names", () => {} )
	test( "rejects empty-string names", () => {} )
	test( "rejects non-string codes", () => {} )
	test( "rejects empty-string codes", () => {} )
	test( "rejects predefined codes", () => {} )
	test( "rejects non-Array args", () => {} )
} )

impl.FVal.prototype.must_accept = function ( ...values ) {}
impl.FVal.prototype.must_reject = function ( ...params ) {}

