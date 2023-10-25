import expressWs from 'express-ws';
import express from 'express';


import type { QueueResponse } from '../lib/messageQueue.js';
import {mainQueue} from '../lib/messageQueue.js';

import {router as monitorRouter} from './messageQueue.monitor.js';
import { Message, isMessagePayload } from '../lib/messageQueueMessages.js';

export default function (wsInstance: expressWs.Instance): expressWs.Router {
	const router = express.Router();

	// adds a message with topic to the messageQueue
	router.post('/add/:topic',(req, res)=>{
		if(req.is('json')){
			mainQueue.addMessage(req.params.topic,req.body);
			res.sendStatus(200);
		}else{
			res.sendStatus(415);
		}
	});

	// retrieves messages since lastId for a topic
	router.get('/get/:topic/:lastId(\\d*)',(req, res)=>{
		const lastId = Number(req.params.lastId);
		const messages : Message[] = [...mainQueue.messagesSinceId(lastId, [req.params.topic])];
		const queueLastMessage = mainQueue.getId();
		const response: QueueResponse = {latestId:queueLastMessage, messages:messages};
		res.status(200);
		res.send(response);
	});

	// fetches the latest stage location
	router.get('/get/location', async (req, res) => {
		const pt = await mainQueue.locationUpdate();
		res.json(pt);
	});

	router.get('/devices', async (req, res) => {
		res.render('messageQueue/device_list');
	});

	router.get('/deviceTable', async (req, res) => {
		const devices = await mainQueue.getDevices();
		res.render('messageQueue/device_list_table',{devices});
	});

	router.ws('/listen', async (ws, req) => {
		const currentId = mainQueue.getId();
		const generator = mainQueue.messagesSinceIdAsync(currentId, 'all');	
		for await (const msg of generator){
			ws.send(JSON.stringify(msg));
		}
	});

	router.ws('/listen/:topic', async (ws, req) => {
		const currentId = mainQueue.getId();
		const generator = mainQueue.messagesSinceIdAsync(currentId, [req.params.topic]);	
		for await (const msg of generator){
			ws.send(JSON.stringify(msg));
		}
	});

	router.ws('/ws', async (ws, req) => {
		const currentId = mainQueue.getId();
		const generator = mainQueue.messagesSinceIdAsync(currentId, 'all');
		ws.onmessage = (msg) => {
			if(isMessagePayload(msg.data)) {
				mainQueue.addMessage(msg.data);
			}
		};
		for await (const msg of generator){
			ws.send(JSON.stringify(msg));
		}
	});

	// redirects to the monitor
	router.use('/monitor',monitorRouter);

	return router;
}
