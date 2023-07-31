
import express from 'express';
export const router = express.Router();

import {mainQueue} from '../lib/messageQueue.js';

import {messageQueue as config} from '../config.js';


/**
 * Renders monitor page
 */
router.get('/:lastId(\\d+)?', (req, res)=>{
	const lId: number = (req.params.lastId)?Number(req.params.lastId):0;
	res.render('messageQueue/monitor',{lastId:lId, reloadTime: config.monitorReloadTime});
});

router.get('/list/:lastId(\\d+)?', (req, res)=>{
	console.log("listins");
	const lId: number = (req.params.lastId)?Number(req.params.lastId):0;
	const msgs = [...mainQueue.messagesSinceId(lId, 'all')];
	res.render('messageQueue/list',{messages:msgs});
});
