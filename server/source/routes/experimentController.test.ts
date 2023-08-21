import { test } from "node:test";
import assert from "node:assert";

import { ExperimentFormData, isExperimentFormData } from "./experimentController.js";

test('isExperimentFormData', {timeout: 1000}, async (tstctx) => {
	// check valid object
	await tstctx.test('valid object', async () => {
		assert(isExperimentFormData({
			name: 'name',
			description: 'description'
		})===true);
	});

	// check invalid object, missing name
	await tstctx.test('invalid object, missing name', async () => {
		assert(isExperimentFormData({
			description: 'description'
		})===false);
	});

	// check invalid object, missing description
	await tstctx.test('invalid object, missing description', async () => {
		assert(isExperimentFormData({
			name: 'name'
		})===false);
	});

	// check invalid object, missing both
	await tstctx.test('invalid object, missing both', async () => {
		assert(isExperimentFormData({})===false);
	});

	// check invalid item, not an object
	await tstctx.test('invalid item, not an object', async () => {
		assert(isExperimentFormData('')===false);
	});
});
