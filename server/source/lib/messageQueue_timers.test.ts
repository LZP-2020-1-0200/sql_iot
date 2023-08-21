import FakeTimers from '@sinonjs/fake-timers';
import { MessageQueue, locationUpdateFetchTimeout, locationUpdateMaxTries } from './messageQueue.js';
import { mock, test } from "node:test";
import assert from "node:assert";

test('MessageQueue timer sensitive tests', {timeout: 1000}, async (tctx) => {
	// check that the queue resets after the timeout
	await tctx.test('Queue resetting timeouts', {timeout: 1000}, async () => {
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
	await tctx.test('Queue location update', {timeout: 1000}, async (tctx) => {
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

		await tctx.test('Just in time', {timeout: 1000}, async () => {
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

	await tctx.test('messagesSinceIdAsync', {timeout: 1000}, async (tctx) => {
		await tctx.test('Works as sync queue', async () => {
			const queue = new MessageQueue();
			queue.addMessage('x', 'x');
			queue.addMessage('y', 'y');
			queue.addMessage('z', 'z');
			const messages = queue.messagesSinceIdAsync(0, ['x', 'y', 'z']);
			const returnal = [(await messages.next()).value, (await messages.next()).value, (await messages.next()).value];
			assert.deepStrictEqual(returnal, [
				{topic:'x', body: 'x'},
				{topic:'y', body: 'y'},
				{topic:'z', body: 'z'},
			]);
		});

		await tctx.test('Mixed order', async () => {
			const queue = new MessageQueue();
			queue.addMessage('x', 'x');
			queue.addMessage('y', 'y');
			const messages = queue.messagesSinceIdAsync(0, 'all');
			const returnal = [(await messages.next()).value];
			queue.addMessage('z', 'z');
			returnal.push((await messages.next()).value);
			returnal.push((await messages.next()).value);
			assert.deepStrictEqual(returnal, [
				{topic:'x', body: 'x'},
				{topic:'y', body: 'y'},
				{topic:'z', body: 'z'},
			]);
		});

		await tctx.test('Time skipping', async () => {
			const clock = FakeTimers.install();
			const queue = new MessageQueue();
			const generator = queue.messagesSinceIdAsync(0, 'all');
			const returnal = [];
			queue.addMessage('x', 'x');
			queue.addMessage('y', 'y');
			clock.tick(124000);
			returnal.push((await generator.next()).value);
			clock.tick(13000);
			queue.addMessage('z', 'z');
			clock.tick(1000);
			returnal.push((await generator.next()).value);
			clock.tick(1500);
			returnal.push((await generator.next()).value);
			assert.deepStrictEqual(returnal, [
				{topic:'x', body: 'x'},
				{topic:'y', body: 'y'},
				{topic:'z', body: 'z'},
			]);
			clock.uninstall();
		});

		await tctx.test('Make generator wait', async () => {
			const clock = FakeTimers.install();
			const queue = new MessageQueue();
			const generator = queue.messagesSinceIdAsync(0, 'all');
			const returnal = [];
			queue.addMessage('x', 'x');
			queue.addMessage('y', 'y');
			clock.tick(124000);
			returnal.push((await generator.next()).value);
			returnal.push((await generator.next()).value);
			let promise = generator.next();
			queue.addMessage('z', 'zx');
			clock.tick(13000);
			clock.runAll();
			returnal.push((await promise).value);
			assert.deepStrictEqual(returnal, [
				{topic:'x', body: 'x'},
				{topic:'y', body: 'y'},
				{topic:'z', body: 'zx'},
			]);
			clock.uninstall();
		});

		await tctx.test('Filter test', async () => {
			const queue = new MessageQueue();
			queue.addMessage('x', 'x');
			queue.addMessage('y', 'y');
			queue.addMessage('z', 'z');
			const messages = queue.messagesSinceIdAsync(0, ['x', 'z']);
			const returnal = [(await messages.next()).value, (await messages.next()).value];
			assert.deepStrictEqual(returnal, [
				{topic:'x', body: 'x'},
				{topic:'z', body: 'z'},
			]);
		});
	});
});
