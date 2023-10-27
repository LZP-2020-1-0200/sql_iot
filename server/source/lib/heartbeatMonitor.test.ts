import FakeTimers from '@sinonjs/fake-timers';
import { MessageQueue } from './messageQueue.js';
import { mock, test } from "node:test";
import assert from "node:assert";
import { HeartbeatMonitor } from './heartbeatMonitor.js';
import { heartbeatTimeout } from '../config.js';
import { HeartbeatMessage } from './messageQueueMessages.js';

test('heartbeatMonitor', {timeout: 1000}, async (tctx) => {

	await tctx.test('addDevice', async (tctx) => {
		const messageQueue = new MessageQueue();
		const callback = () => {};
		const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
		heartbeatMonitor.addDevice('test');
		assert.strictEqual(heartbeatMonitor.getDevices().length, 1);
	});

	await tctx.test('removeDevice', async (tctx) => {
		const messageQueue = new MessageQueue();
		const callback = () => {};
		const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
		heartbeatMonitor.addDevice('test');
		heartbeatMonitor.removeDevice('test');
		assert.strictEqual(heartbeatMonitor.getDevices().length, 0);
	});

	await tctx.test('start', async (tctx) => {
		await tctx.test('no heartbeat', async (tctx) => {
			const messageQueue = new MessageQueue();
			const callback = mock.fn();
			const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
			const clock = FakeTimers.install();
			heartbeatMonitor.addDevice('test');
			heartbeatMonitor.start();
			clock.tick(1000);
			assert.strictEqual(callback.mock.callCount(), 0);
			clock.tick(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 1);
			clock.tick(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 1);
			assert.strictEqual(heartbeatMonitor.getDevices().length, 0);
			clock.uninstall();
		});

		await tctx.test('heartbeat', async (tctx) => {
			const messageQueue = new MessageQueue();
			const callback = mock.fn();
			const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
			const clock = FakeTimers.install();
			heartbeatMonitor.addDevice('test');
			heartbeatMonitor.start();
			clock.tick(1000);
			assert.strictEqual(callback.mock.callCount(), 0);
			messageQueue.addMessage({ topic:'heartbeat', body: {name: 'test'}} as HeartbeatMessage);
			await clock.tickAsync(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 0);
			await clock.tickAsync(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 1);
			assert.strictEqual(heartbeatMonitor.getDevices().length, 0);
			clock.uninstall();
		});

		await tctx.test('prolonged heartbeat', async (tctx) => {
			const messageQueue = new MessageQueue();
			const callback = mock.fn();
			const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
			const clock = FakeTimers.install();
			heartbeatMonitor.addDevice('test');
			heartbeatMonitor.start();
			clock.tick(1000);
			for(let i = 0; i < 1000; i++){
				assert.strictEqual(callback.mock.callCount(), 0);
				messageQueue.addMessage({ topic:'heartbeat', body: {name: 'test'}} as HeartbeatMessage);
				await clock.tickAsync(heartbeatTimeout);
				assert.strictEqual(callback.mock.callCount(), 0);
			}
			await clock.tickAsync(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 1);
			assert.equal(callback.mock.calls[0].arguments[0], 'test');
			clock.uninstall();
		});

		await tctx.test('multiple devices', async (tctx) => {
			const messageQueue = new MessageQueue();
			const callback = mock.fn();
			const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
			const clock = FakeTimers.install();
			heartbeatMonitor.addDevice('test1');
			heartbeatMonitor.addDevice('test2');
			heartbeatMonitor.start();
			clock.tick(1000);
			assert.strictEqual(callback.mock.callCount(), 0);
			messageQueue.addMessage({ topic:'heartbeat', body: {name: 'test1'}} as HeartbeatMessage);
			assert.strictEqual(callback.mock.callCount(), 0);
			messageQueue.addMessage({ topic:'heartbeat', body: {name: 'test2'}} as HeartbeatMessage);
			await clock.tickAsync(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 0);
			await clock.tickAsync(heartbeatTimeout);
			assert.strictEqual(callback.mock.callCount(), 2);
			clock.uninstall();
		});

		await tctx.test('highly inconsistent heartbeat', async (tctx) => {
			const messageQueue = new MessageQueue();
			const callback = mock.fn();
			const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
			const clock = FakeTimers.install();
			heartbeatMonitor.addDevice('test1');
			heartbeatMonitor.start();
			for(let i=0;i<500;i++){
				messageQueue.addMessage({ topic:'heartbeat', body: {name: 'test1'}} as HeartbeatMessage);
				await clock.tickAsync(heartbeatTimeout*Math.random()*0.8);
			}
			assert.strictEqual(callback.mock.callCount(), 0);
			await clock.tickAsync(heartbeatTimeout*2);
			assert.strictEqual(callback.mock.callCount(), 1);
			clock.uninstall();
		});
	});

	tctx.test('stop', async (tctx) => {
		const messageQueue = new MessageQueue();
		const callback = mock.fn();
		const heartbeatMonitor = new HeartbeatMonitor(messageQueue, callback);
		const clock = FakeTimers.install();
		heartbeatMonitor.addDevice('test');
		heartbeatMonitor.start();
		clock.tick(1000);
		assert.strictEqual(callback.mock.callCount(), 0);
		heartbeatMonitor.stop();
		clock.tick(heartbeatTimeout*3);
		assert.strictEqual(callback.mock.callCount(), 0);
		clock.uninstall();
	});

});