import FakeTimers from '@sinonjs/fake-timers';
import { MessageQueue } from './messageQueue.js';
import { mock, test } from "node:test";
import assert from "node:assert";
import { Sequencer } from './sequencer.js';

test('sequencer', async (tctx) => {
	let clock: FakeTimers.InstalledClock | null = null;
	let onMeasure = mock.fn();
	let onSequence = mock.fn();
	let sequencer = new Sequencer();

	tctx.beforeEach(() => {
		clock = FakeTimers.install();
		onMeasure = mock.fn();
		onSequence = mock.fn();
		sequencer = new Sequencer();
		sequencer.onMeasure = onMeasure;
		sequencer.onSequence = onSequence;
	});

	tctx.afterEach(() => {
		if(clock !== null) clock.uninstall();
	});

	await tctx.test('empty sequence', async (tctx) => {
		sequencer.loadSequence([]);
		sequencer.start();
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 0);
		assert.strictEqual(onSequence.mock.callCount(), 0);
		assert.strictEqual(sequencer.isDone(), true);
	});

	await tctx.test('single sequence item', async (tctx) => {
		sequencer.loadSequence([{required: ['test'], optional: []}]);
		sequencer.start();
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 1);
		assert.strictEqual(onSequence.mock.callCount(), 1);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 1);
		assert.strictEqual(onSequence.mock.callCount(), 1);
		assert.strictEqual(sequencer.isDone(), true);
	});

	await tctx.test('multiple sequence items, all required', async (tctx) => {
		sequencer.loadSequence([
			{required: ['test1'], optional: []},
			{required: ['test2'], optional: []},
			{required: ['test3', 'test4'], optional: []}
		]);
		sequencer.start();
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 1);
		assert.strictEqual(onSequence.mock.callCount(), 1);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test1');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 2);
		assert.strictEqual(onSequence.mock.callCount(), 2);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test2');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 4);
		assert.strictEqual(onSequence.mock.callCount(), 3);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test3');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 4);
		assert.strictEqual(onSequence.mock.callCount(), 3);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test4');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 4);
		assert.strictEqual(onSequence.mock.callCount(), 3);
		assert.strictEqual(sequencer.isDone(), true);

	});

	await tctx.test('multiple sequence items, some optional', async (tctx) => {
		sequencer.loadSequence([
			{required: ['test1', 'test2'], optional: ['test3']},
			{required: ['test4'], optional: ['test5', 'test6']},
			{required: ['test7'], optional: ['test8', 'test9', 'test10']}
		]);
		sequencer.start();
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 3);
		assert.strictEqual(onSequence.mock.callCount(), 1);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test1');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 3);
		assert.strictEqual(onSequence.mock.callCount(), 1);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test2');
		sequencer.markReady('test4');
		sequencer.markReady('test9');
		sequencer.markReady('test3')
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 10);
		assert.strictEqual(onSequence.mock.callCount(), 3);
		assert.strictEqual(sequencer.isDone(), false);
		sequencer.markReady('test7');
		await clock?.tickAsync(1000);
		assert.strictEqual(onMeasure.mock.callCount(), 10);
		assert.strictEqual(onSequence.mock.callCount(), 3);
		assert.strictEqual(sequencer.isDone(), true);
	});
});