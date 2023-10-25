import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import msgQueue from './messageQueue.js';
import expressWs from 'express-ws';
import { mainQueue } from '../lib/messageQueue.js';
import { Message } from '../lib/messageQueueMessages.js';
describe('device table endpoint', {timeout: 1000}, async () => {
	const url = '/deviceTable';
	it('calls deviceUpdate on the main queue ', async () => {
		const updateMock = mock.fn(mainQueue.getDevices, async ()=>{
			return [];
		});
		mainQueue.getDevices = updateMock;
		const expressApp = express();
		const wsInstance = expressWs(expressApp);
		const app = wsInstance.app;
		app.use(msgQueue(wsInstance));
		app.use(express.json());
		app.set('view engine', 'ejs');
		const response = await request(app).get(url).expect(200);
		assert.deepStrictEqual(updateMock.mock.calls.length, 1);
		updateMock.mock.restore();
	});
});

describe('add topic endpoint', {timeout: 1000}, async () => {
	const url = '/add';
	it('calls addTopic on the main queue ', async () => {
		const addMessageMock = mock.fn(mainQueue.addMessage, async ()=>{
			return [];
		});
		mainQueue.addMessage = addMessageMock;
		const expressApp = express();
		const wsInstance = expressWs(expressApp);
		const app = wsInstance.app;
		app.use(msgQueue(wsInstance));
		app.use(express.json());
		app.set('view engine', 'ejs');
		const response = await request(app).post(`${url}/dat`).send({data:2}).expect(200);
		assert.deepStrictEqual(addMessageMock.mock.calls.length, 1);
		addMessageMock.mock.restore();
	});

	it('responds with 415 if invalid body', async () => {
		const expressApp = express();
		const wsInstance = expressWs(expressApp);
		const app = wsInstance.app;
		app.use(msgQueue(wsInstance));
		app.use(express.json());
		app.set('view engine', 'ejs');
		const response = await request(app).post(`${url}/dat`).send('dsaf').expect(415);
	});
});

describe('get messages endpoint', {timeout: 1000}, async () => {
	it('calls messagesSinceId on the main queue ', async () => {
		mainQueue.clear();
		const msgMock = mock.method(mainQueue, 'messagesSinceId', function* () {
			yield ({ topic:'das', body:['x'] } as Message);
		});
		const expressApp = express();
		const wsInstance = expressWs(expressApp);
		const app = wsInstance.app;
		app.use(msgQueue(wsInstance));
		app.use(express.json());
		app.set('view engine', 'ejs');
		const response = await request(app).get('/get/dat/0').expect(200);
		assert.deepStrictEqual(msgMock.mock.calls.length, 1);
		msgMock.mock.restore();
		assert.deepStrictEqual(response.body, {latestId:0, messages:[{topic:'das', body:['x']}]})
	});
});

describe('get location endpoint', {timeout: 1000}, async () => {
	it('calls locationUpdate on the main queue ', async () => {
		const locMock = mock.method(mainQueue, 'locationUpdate', async ()=>{
			return {x: 0, y: 0, z: 0};
		});
		const expressApp = express();
		const wsInstance = expressWs(expressApp);
		const app = wsInstance.app;
		app.use(msgQueue(wsInstance));
		app.use(express.json());
		app.set('view engine', 'ejs');
		const response = await request(app).get('/get/location').expect(200);
		assert.deepStrictEqual(locMock.mock.calls.length, 1);
		locMock.mock.restore();
	});
});
