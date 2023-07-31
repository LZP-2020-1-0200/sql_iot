import {Sample} from '../models/index.js';

import express from 'express';
export const sampleController = express.Router();


sampleController.get('/:limit(\\d+)?',async (req,res)=>{
	const limit:number|undefined = (req.params.limit === undefined || req.params.limit === '')?undefined:Number(req.params.limit);
	const allSamples = await Sample.findAll({
		attributes:['name', 'description', 'id'],
		limit
	});
	res.render('sample/index', {samples:allSamples});
});

sampleController.get('/add',(req, res)=>{
	res.render('sample/add');
});

interface SampleForm{
	name:string;
	description:string;
}

function isSampleForm(obj: unknown): obj is SampleForm {
	if(!(typeof obj === 'object' && obj !== null))return false;
	if(!('name' in obj && typeof obj.name === 'string'))return false;
	if(!('description' in obj && typeof obj.description === 'string'))return false;
	return true;
}

sampleController.post('/add', async (req, res) => {
	if(isSampleForm(req.body)){
		const sample = await Sample.create({
			name: req.body.name,
			description: req.body.description
		});
		res.redirect(`/points/${sample.id}`);
	}else{
		res.redirect(400, 'back');
	}
});
