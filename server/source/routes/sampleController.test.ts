

import { test } from "node:test";
import assert from "node:assert";
import { isSampleForm, type SampleForm } from "./sampleController.js";


test('sample form validation', async (tstctx) => {
	
	// check valid form
	await tstctx.test('valid form', async () => {
		const form: SampleForm = {
			name: 'test',
			description: 'test32134',
		};
		assert(isSampleForm(form)===true);
	});

	// invalid form, name is empty string
	await tstctx.test('invalid form, name is ""', async () => {
		const form2: unknown = {
			name: "",
			description: 'test32134',
		};
		assert(isSampleForm(form2)===false);
	});

	// invalid form, name is NaN
	await tstctx.test('invalid form, name is NaN', async () => {
		const form3: unknown = {
			name: NaN,
			description: 'test32134',
		};
		assert(isSampleForm(form3)===false);
	});

	// valid form, description is empty string
	await tstctx.test('valid form, description is ""', async () => {
		const form4: unknown = {
			name: 'test',
			description: "",
		};
		assert(isSampleForm(form4)===true);
	});


});