
import { test } from "node:test";
import type { pointsetAddForm } from "./pointsetController.js";
import { isPointsetAddForm } from "./pointsetController.js";
import assert from "node:assert";

test('pointset form validation', {timeout: 1000}, async (tstctx) => {

	// check valid form
	await tstctx.test('valid form', async () => {
		const form: pointsetAddForm = {
			name: 'test',
			description: 'test',
			calAx: 0,
			calAy: 0,
			calAz: 0,
			calBx: 0,
			calBy: 0,
			calBz: 0,
			calCx: 0,
			calCy: 0,
			calCz: 0
		};
		assert(isPointsetAddForm(form)===true);
	});

	// check invalid form, coords are empty strings
	await tstctx.test('invalid form, coords are ""', async () => {
		const form2: unknown = {
			name: 'test',
			description: 'test',
			calAx: "",
			calAy: "",
			calAz: "",
			calBx: "",
			calBy: "",
			calBz: "",
			calCx: "",
			calCy: "",
			calCz: ""
		};
		assert(isPointsetAddForm(form2)===false);
	});

	// check invalid form, coords are NaN
	await tstctx.test('invalid form, coords are NaN', async () => {
		const form3: unknown = {	
			name: 'test',
			description: 'test',
			calAx: NaN,
			calAy: NaN,
			calAz: NaN,
			calBx: NaN,
			calBy: NaN,
			calBz: NaN,
			calCx: NaN,
			calCy: NaN,
			calCz: NaN
		};
		assert(isPointsetAddForm(form3)===false);
	});

	// check invalid form, coords are undefined
	await tstctx.test('invalid form, coords are undefined', async () => {
		const form4: unknown = {
			name: 'test',
			description: 'test',
		};
		assert(isPointsetAddForm(form4)===false);
	});

	// check invalid form, coords are null
	await tstctx.test('invalid form, coords are null', async () => {
		const form5: unknown = {
			name: 'test',
			description: 'test',
			calAx: null,
			calAy: null,
			calAz: null,
			calBx: null,
			calBy: null,
			calBz: null,
			calCx: null,
			calCy: null,
			calCz: null
		};
		assert(isPointsetAddForm(form5)===false);
	});

	// check invalid form, form is not an object
	await tstctx.test('invalid form, form is not an object', async () => {
		const form6: unknown = 1;
		assert(isPointsetAddForm(form6)===false);
	});
});