
import { test } from "node:test";
import assert from "node:assert";
import { isnumarr } from "./pointController.js";

test('isnumarray', async (tstctx) => {
	// check valid array
	await tstctx.test('valid array', async () => {
		assert(isnumarr([1,2,3,4,5])===true);
	});

	// check valid array, contains NaN
	await tstctx.test('invalid array, contains NaN', async () => {
		assert(isnumarr([1,2,3,4,NaN])===true);
	});

	// check invalid array, contains string
	await tstctx.test('invalid array, contains string', async () => {
		assert(isnumarr([1,2,3,4,""])===false);
	});

	// check invalid array, contains object
	await tstctx.test('invalid array, contains object', async () => {
		assert(isnumarr([1,2,3,4,{}])===false);
	});

	// check invalid array, contains array
	await tstctx.test('invalid array, contains array', async () => {
		assert(isnumarr([1,2,4,[],-32])===false);
	});
});