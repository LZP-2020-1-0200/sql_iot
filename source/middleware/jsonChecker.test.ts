import express from 'express';
import { test } from "node:test";
import { jsonCheck } from "./jsonChecker.js";
import assert from "node:assert";
import request from 'supertest';

test('jsonChecker middleware', async () => {
	const app = express();
	app.use(express.json());
	app.get('/', jsonCheck, (req, res) => {
		res.send('test');
	});
	await request(app).get('/').send('{vdsv d').then((res) => {
		assert(res.statusCode===400);
	});
	await request(app).get('/').send({fd:5433}).then(res => {
		assert(res.statusCode===200);
		assert(res.text==='test');
	});	
});