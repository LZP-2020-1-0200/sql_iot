
import express from 'express';
export const router = express.Router();

import type { MessagePayload, QueueResponse} from '../lib/messageQueue.js';
import {mainQueue} from '../lib/messageQueue.js';

import {router as monitorRouter} from './messageQueue.monitor.js';


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
	const messages : MessagePayload[] = [...mainQueue.messagesSinceId(lastId, [req.params.topic])];
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
	const devices = await mainQueue.deviceUpdate();
	res.render('messageQueue/device_list_table',{devices});
});

// redirects to the monitor
router.use('/monitor',monitorRouter);
