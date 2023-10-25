import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import { MessageQueue } from './messageQueue.js';
import FakeTimers from '@sinonjs/fake-timers';
import { Point } from '../models/Point.js';
import '../models/index.js';



test('Sequencer tests', async (tctx) => {
/*
	await tctx.test('Sequencer order', async () => {
		let sequencer = new Sequencer();
		sequencer.addDevice({name: 'b', sequence: 1, priority: true});
		sequencer.addDevice({name: 'a', sequence: 0, priority: true});
		sequencer.addDevice({name: 'c', sequence: 2, priority: true});
		sequencer.addDevice({name: 'd', sequence: 3, priority: true});
		const mockFn = mock.fn();
		//sequencer.deviceEvent.on('notify', mockFn);
		sequencer.initiate(mockFn);
		assert(sequencer.isDone() === false);
		assert(mockFn.mock.calls.length === 1 as number);
		assert(sequencer.getWaitList().length === 1);
		sequencer.markDeviceAsDone('a');
		
		assert(mockFn.mock.calls.length === 2 as number);
		sequencer.markDeviceAsDone('b');
		assert(mockFn.mock.calls.length === 3 as number);
		sequencer.markDeviceAsDone('c');
		assert(mockFn.mock.calls.length === 4 as number);
		sequencer.markDeviceAsDone('d');
		assert(sequencer.isDone());
		
	});

	await tctx.test('Sequencer order with non-priority', async () => {
		let sequencer = new Sequencer();
		sequencer.addDevice({name: 'b', sequence: 1, priority: false});
		sequencer.addDevice({name: 'a', sequence: 0, priority: false});
		sequencer.addDevice({name: 'c', sequence: 2, priority: false});
		sequencer.addDevice({name: 'd', sequence: 3, priority: false});
		const mockFn = mock.fn();
		//sequencer.deviceEvent.on('notify', mockFn);
		sequencer.initiate(mockFn);
		assert(sequencer.isDone());
		assert(mockFn.mock.calls.length === 4 as number);
	});

	await tctx.test('Sequencer order with mixed priority', async () => {
		let sequencer = new Sequencer();
		sequencer.addDevice({name: 'b', sequence: 1, priority: false});
		sequencer.addDevice({name: 'a', sequence: 0, priority: true});
		sequencer.addDevice({name: 'c', sequence: 2, priority: false});
		sequencer.addDevice({name: 'd', sequence: 3, priority: true});
		const mockFn = mock.fn();
		sequencer.initiate(mockFn);
		assert(!sequencer.isDone());
		assert(mockFn.mock.calls.length === 1 as number);
		assert(sequencer.getWaitList().length === 1);
		sequencer.markDeviceAsDone('a');
		assert(mockFn.mock.calls.length === 4 as number);
		assert(!sequencer.isDone())
		sequencer.markDeviceAsDone('d');
		assert(sequencer.isDone());
	});
	*/
	/*
	await tctx.test('Sequence point', async () => {
		const clock = FakeTimers.install();
		let sequencer = new Sequencer();
		let messageQueue = new MessageQueue();
		let sequencerMark = mock.method(sequencer, 'markDeviceAsDone', sequencer.markDeviceAsDone);
		sequencer.addDevice({name: 'a', sequence: 2, priority: true});
		sequencer.addDevice({name: 'b', sequence: 1, priority: false});
		sequencePoint(
			{
				x: 1,
				y: 2,
				z: 3,
			},
			0,
			0,
			messageQueue,
			sequencer);
		messageQueue.addMessage('ready', {name: 'a', sequence: 2} as ReadyMessage["body"]);
		await clock.tickAsync(1000);
		messageQueue.addMessage('ready', {name: 'b', sequence: 1} as ReadyMessage["body"]);
		// 5 messages: measure, measure, measure, ready, ready
		assert.equal([...messageQueue.messagesSinceId(0, ['all'])].length, 5);
		assert.equal(sequencerMark.mock.calls.length, 1);
		assert(sequencer.isDone());
		clock.uninstall();
	});
	*/
	/*
	await tctx.test('Sequenced experiment launch', async () => {
		let clock = FakeTimers.install();
		let messageQueue = new MessageQueue();
		let getDeviceMock = mock.method(messageQueue, 'getDevices', async () => {
			return [
				{
					name: 'a',
					sequence: 2,
					priority: true
				},
				{
					name: 'b',
					sequence: 1,
					priority: false
				}
			]	
		});
		let pt: Point[] = Point.bulkBuild([
			{
				pointNumber: 2,
				pointsetId: 23,
				x: 1,
				y: 2,
				z: 3
			},
			{
				pointNumber: 3,
				pointsetId: 23,
				x: 4,
				y: 5,
				z: 6
			},
			{
				pointNumber: 4,
				pointsetId: 23,
				x: 7,
				y: 8,
				z: 9
			}
		]);
		launchSequencedExperiment(messageQueue, 23, pt);
		await clock.tickAsync(1000);
		messageQueue.addMessage('ready', {name: 'a', sequence: 2} as ReadyMessage["body"]);
		await clock.tickAsync(1000);
		messageQueue.addMessage('ready', {name: 'a', sequence: 2} as ReadyMessage["body"]);
		await clock.tickAsync(1000);
		messageQueue.addMessage('ready', {name: 'a', sequence: 2} as ReadyMessage["body"]);
		await clock.tickAsync(1000);
		// 3*3 + 3*1 = 12 messages: 
		// [measure, measure, measure, ready]*3
		const topics = ['measure', 'measure', 'measure', 'ready'];
		const msgs = [...messageQueue.messagesSinceId(0, topics)];
		for(let i = 0; i < 12; i++) {
			const msgtopic = msgs[i].topic;
			assert.equal(msgtopic, topics[i % 4], `Topics ${msgs.map((item) => item.topic)} didn't match expected.`);
		}
		clock.uninstall();
		
	});
	*/
});