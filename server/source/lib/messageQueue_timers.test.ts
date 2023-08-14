import FakeTimers from '@sinonjs/fake-timers';
import { MessageQueue, locationUpdateFetchTimeout, locationUpdateMaxTries } from './messageQueue.js';
import { mock, test } from "node:test";
import assert from "node:assert";

test('MessageQueue timer sensitive tests', async (tctx) => {
	// check that the queue resets after the timeout
	await tctx.test('Queue resetting timeouts', async () => {
		// set up timer fakes
		const clock = FakeTimers.install();
		const queue = new MessageQueue();
		queue.addMessage('x', 'x');
		clock.tick(queue.timeout/2);
		assert(queue.getId()===1);
		queue.addMessage('x', 'y');
		clock.tick(queue.timeout);
		assert(queue.getId()===2);
		clock.tick(queue.timeout+1);
		assert(queue.getId()===0);
		clock.runAll();
		clock.uninstall();
	});

	// message queue location update
	await tctx.test('Queue location update', async (tctx) => {
		await tctx.test('Timeout test', async () => {
			// set up timer fakes
			const clock = FakeTimers.install();
			const initialPoint = {x:55, y:55, z:55};
			const queue = new MessageQueue();
			queue.lastPoint = structuredClone(initialPoint);
			queue.addMessage('x', 'x');
			const promise = queue.locationUpdate();
			clock.tick(locationUpdateMaxTries*locationUpdateFetchTimeout+1);
			await clock.runAllAsync();
			// expect the promise's timers to be cleared
			const point = await promise;
			clock.uninstall();
			assert.deepEqual(point, initialPoint);
		});

		await tctx.test('Just in time', async () => {
			const waitTime = locationUpdateMaxTries*locationUpdateFetchTimeout;
			// set up timer fakes
			const clock = FakeTimers.install();
			const initialPoint = {x:55, y:55, z:55};
			const swappedPoint = {x:1, y:2, z:3};
			const queue = new MessageQueue();
			queue.lastPoint = structuredClone(initialPoint);
			queue.addMessage('x', 'x');
			const promise = queue.locationUpdate();
			clock.tick(waitTime-1);
			queue.addMessage('point_info', swappedPoint);
			clock.tick(2);
			await clock.runAllAsync();
			// expect the promise's timers to be cleared
			const point = await promise;
			clock.uninstall();
			assert.deepEqual(point, swappedPoint);
		});

		await tctx.test('Missed the train', async () => {
			const waitTime = locationUpdateMaxTries*locationUpdateFetchTimeout;
			// set up timer fakes
			const clock = FakeTimers.install();
			const initialPoint = {x:55, y:55, z:55};
			const swappedPoint = {x:1, y:2, z:3};
			const queue = new MessageQueue();
			queue.lastPoint = structuredClone(initialPoint);
			queue.addMessage('x', 'x');
			const promise = queue.locationUpdate();
			clock.tick(waitTime+1);
			// make sure all callbacks are called
			await clock.runAllAsync();
			queue.addMessage('point_info', swappedPoint);
			await clock.runAllAsync();
			// expect the promise's timers to be cleared
			const point = await promise;
			clock.uninstall();
			assert.deepStrictEqual(point, initialPoint);
		});

		await tctx.test('Early quit', async () => {
			const waitTime = locationUpdateFetchTimeout*(2/3);
			// set up timer fakes
			const clock = FakeTimers.install();
			const initialPoint = {x:55, y:55, z:55};
			const swappedPoint = {x:1, y:2, z:3};
			const queue = new MessageQueue();
			queue.lastPoint = structuredClone(initialPoint);
			const promise = queue.locationUpdate();
			clock.tick(waitTime);
			queue.addMessage('point_info', swappedPoint);
			clock.tick(locationUpdateFetchTimeout);
			await clock.runAllAsync();
			// expect the promise's timers to be cleared
			const point = await promise;
			clock.uninstall();

			assert.deepStrictEqual(point, swappedPoint);
			assert.notDeepStrictEqual(point, initialPoint);
		});
	});
});
