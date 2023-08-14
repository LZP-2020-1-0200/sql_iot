import express from 'express';
import bodyParser from 'body-parser';
import type { MessagePayload, QueueResponse} from './lib/messageQueue.js';
import { mainQueue } from './lib/messageQueue.js';
import { server as config } from './config.js';
const app = express();
const port = config.port;
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('static'));
//var mysql      = require('mysql2');

//dev url logger
app.use((req, res, next)=>{
	//console.log(req.url);
	next();
});



// messageQueue route 
import {router as msgQRouter} from './routes/messageQueue.js';
app.use('/messageQueue', msgQRouter);

import { sampleController } from './routes/sampleController.js';
app.use('/samples', sampleController);

import { pointsetController } from './routes/pointsetController.js';
app.use('/points', pointsetController);

import { pointController } from './routes/pointController.js';
app.use('/pt', pointController);

import { experimentController } from './routes/experimentController.js';
app.use('/experiments', experimentController);

// main page redirects to samples
app.get('/', (req, res) => {res.redirect('/samples');});

// posts new messages to the queue
app.post('/', (req, res) => {
	if(!req.is('json')){
		res.status(415);
		res.send("Invalid type");
		return;
	}
	if(typeof req.body.topic === 'string' && req.body.body instanceof Object){
		mainQueue.addMessage(req.body.topic, req.body.body);
		res.status(200);
		res.end();
	}else{
		res.status(400);
		res.send("Invalid json");
	} 
});

// retrieves messages from the queue
app.get('/retrieve', (req, res) => {
	const id=Number(req.query.Id);
	const topics:string[]=[];
	if( req.query.topics instanceof Array){
		req.query.topics.forEach((val)=>{if(typeof val ==='string')topics.push(val.toString());});
	}
	if(!isNaN(id)){
		const response: QueueResponse={latestId:mainQueue.getId(), messages:[]};
		const messages: MessagePayload[]=[...mainQueue.messagesSinceId(id,topics)];
		messages.forEach(value=>response.messages.push(value));
		res.send(response);
	}else{
		res.status(400);
		const queueResponse:QueueResponse={latestId:mainQueue.getId(),messages:[]};
		res.send(queueResponse);
	}
});




const server=app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

export function stop(){
	server.close();
}