import { describe, it } from "node:test";
import assert from "node:assert";
import { isPointData, PointData } from "./coordinate.js";

describe('Is point data type guard', () => {
	it('returns true for a valid point data object', () => {
		assert(isPointData({
			x: 0,
			y: 0,
			z: 0
		}) === true);
	});

	it('returns false for an invalid point data object', () => {
		assert(isPointData({
			x: 0,
			y: 0
		}) === false);
	});

	it('returns false for a non-object', () => {
		assert(isPointData(0) === false);
	});

	it('returns false for null', () => {
		assert(isPointData(null) === false);
	});

	it('returns false for undefined', () => {
		assert(isPointData(undefined) === false);
	});
});