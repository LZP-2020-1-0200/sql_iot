import assert from "node:assert";
import { Message, MessageQueue } from "./messageQueue.js";
import { test } from "node:test";
import type { JSONValue } from "../config.js";

test('Message packing', () => {
	const dat: JSONValue = {x:54, "0":{data:[1,{c:"d"}]}};
	const msg = new Message('testing123', dat);
	assert.deepEqual({topic: 'testing123', body: dat}, msg.data);
});
test('MessageQueue', async (tctx) => {
	await tctx.test('Queue start id', () => {
		const queue = new MessageQueue();
		assert.strictEqual(queue.getId(), 0);
	});
	
	await tctx.test('Queue single message test', () => {
		const queue = new MessageQueue();
		queue.addMessage('testA', {x:3});
		assert.deepStrictEqual(
			[...queue.messagesSinceId(0, 'testA')],
			[{topic:'testA', body: {x:3}}]);
	});
	
	await tctx.test('Queue message filters', () => {
		const queue = new MessageQueue();
		queue.addMessage('testA', {x:3});
		queue.addMessage('testB', {u:'asd'});
		assert.deepStrictEqual(
			[...queue.messagesSinceId(0, 'testA')],
			[{topic:'testA', body: {x:3}}]);
	});
	
	await tctx.test('Queue fetch no filter', () => {
		const queue = new MessageQueue();
		queue.addMessage('testA', {x:3});
		queue.addMessage('testB', {u:'asd'});
		assert.deepStrictEqual(
			[...queue.messagesSinceId(0, 'all')],
			[
				{topic:'testA', body: {x: 3}},
				{topic:'testB', body: {u: 'asd'}}
			]);
	});
	
	await tctx.test('Queue timeout', (t) => {
		const testStartTime = Date.now();
		const startDate = 56000;
		const timeMock = t.mock.fn(Date.now, () => startDate);
		Date.now = timeMock;
		const queue = new MessageQueue();
		queue.addMessage('testA', {x:3});
		queue.addMessage('testB', {u:'asd'});
		timeMock.mock.mockImplementation(()=> startDate + queue.timeout + 1);
		assert(queue.getId()==0);
		assert.deepStrictEqual([...queue.messagesSinceId(0, 'all')], []);
		timeMock.mock.restore();
		assert(Date.now()>=testStartTime);//sanity check if Date.now was restored
	});
	
	await tctx.test('Queue resetting timeouts', (t) => {
		// set up Date.now() mock
		const startDate = 56000;
		const timeMock = t.mock.fn(Date.now, () => startDate);
		Date.now = timeMock;
		const queue = new MessageQueue();
		queue.addMessage('x', 'x');
		timeMock.mock.mockImplementation(()=> startDate + queue.timeout/2);
		assert(queue.getId()===1);
		queue.addMessage('x', 'y');
		timeMock.mock.mockImplementation(()=> startDate + queue.timeout);
		queue.timeUpdate();
		assert(queue.getId()===2);
		timeMock.mock.mockImplementation(()=> startDate + queue.timeout*2+1);
		assert(queue.getId()===0);
	});
});
