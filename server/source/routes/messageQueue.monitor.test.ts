import { test } from "node:test";
import assert from "node:assert";
import express from "express";
import request from "supertest";

import { router } from "./messageQueue.monitor.js";
import { mainQueue } from "../lib/messageQueue.js";

test("GET /messageQueue/monitor/api/list", {timeout: 1000}, async (tctx) => {
	const app = express();
	app.use(router);
	await tctx.test('empty queue', async () => {
		const lastId = mainQueue.getId();
		const response = await request(app).get(`/api/list/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, []);
	});
	
	await tctx.test('queue with one message', async () => {
		const lastId = mainQueue.getId();
		const msg = { topic: 'test', body: { test: 'test' } };
		mainQueue.addMessage(msg.topic, msg.body);
		const response = await request(app).get(`/api/list/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, [msg]);
	});

	await tctx.test('get whole queue', async () => {
		const msg = { topic: 'test', body: { test: 'test' } };
		const msg2 = { topic: 'test2', body: { test: 'test2' } };
		mainQueue.clear();
		mainQueue.addMessage(msg.topic, msg.body);
		mainQueue.addMessage(msg2.topic, msg2.body);
		const response = await request(app).get(`/api/list/`).expect(200);
		assert.deepStrictEqual(response.body, [msg, msg2]);
	});
});

test("GET /messageQueue/monitor/api/list/topic/:topic", async (tctx) => {
	const app = express();
	app.use(router);
	await tctx.test('empty queue', async () => {
		const lastId = mainQueue.getId();
		const response = await request(app).get(`/api/list/topic/test/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, []);
	});

	await tctx.test('queue with one message', async () => {
		const lastId = mainQueue.getId();
		const msg = { topic: 'test', body: { test: 'test' } };
		mainQueue.addMessage(msg.topic, msg.body);
		const response = await request(app).get(`/api/list/topic/test/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, [msg]);
	});

	await tctx.test('queue with one message of different topic', async () => {
		const lastId = mainQueue.getId();
		const msg = { topic: 'test', body: { test: 'test' } };
		mainQueue.addMessage(msg.topic, msg.body);
		const response = await request(app).get(`/api/list/topic/test2/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, []);
	});

	await tctx.test('queue with two messages', async () => {
		const lastId = mainQueue.getId();
		const msg = { topic: 'test', body: { test: 'test' } };
		const msg2 = { topic: 'test', body: { test: 'test2' } };
		mainQueue.addMessage(msg.topic, msg.body);
		mainQueue.addMessage(msg2.topic, msg2.body);
		const response = await request(app).get(`/api/list/topic/test/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, [msg, msg2]);
	});

	await tctx.test('queue with two messages of different topic', async () => {
		const lastId = mainQueue.getId();
		const msg = { topic: 'test', body: { test: 'test' } };
		const msg2 = { topic: 'test2', body: { test: 'test2' } };
		mainQueue.addMessage(msg.topic, msg.body);
		mainQueue.addMessage(msg2.topic, msg2.body);
		const response = await request(app).get(`/api/list/topic/test/${lastId}`).expect(200);
		assert.deepStrictEqual(response.body, [msg]);
	});
});