import expressWs, {type Instance} from 'express-ws';
import {Pointset, Sample} from '../models/index.js';
import express from 'express';




export interface SampleForm{
	name:string;
	description:string;
}

/**
 * Type guard for SampleForm
 * @param obj the object to check
 * @returns true if the object is a SampleForm
 */
export function isSampleForm(obj: unknown): obj is SampleForm {
	if(!(typeof obj === 'object' && obj !== null))return false;
	if(!('name' in obj && typeof obj.name === 'string'))return false;
	if(obj.name === '')return false;
	if(!('description' in obj && typeof obj.description === 'string'))return false;
	return true;
}


export default function (wsInstance:Instance): expressWs.Router {
	const sampleController = express.Router();
	wsInstance.applyTo(sampleController);
	/**
	 * Displays the index page for samples
	 */
	sampleController.get('/:limit(\\d+)?',async (req,res)=>{
		const limit:number|undefined = (req.params.limit === undefined || req.params.limit === '')?undefined:Number(req.params.limit);
		const allSamples = await Sample.findAll({
			attributes:['name', 'description', 'id'],
			limit
		});
		res.render('sample/index', {samples:allSamples});
	});

	/**
	 * Displays the add sample page
	 */
	sampleController.get('/add',(req, res)=>{
		res.render('sample/add');
	});

	/**
	 * Endpoint for adding a sample
	 */
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

	sampleController.get('/:sampleId(\\d+)/item', async (req, res) => {
		const sampleId = Number(req.params.sampleId);
		const sample = await Sample.findByPk(sampleId, {include: [Pointset]});
		if(sample === null){
			res.send("Invalid sample id");
		}else{
			res.render('sample/item', {sample});
		}
	});


	sampleController.post('/:sampleId(\\d+)/edit', async (req, res) => {
		const sampleId = Number(req.params.sampleId);
		const sample = await Sample.findByPk(sampleId);
		if(sample === null){
			res.send("Invalid sample id");
		}else{
			if(isSampleForm(req.body)){
				sample.name = req.body.name;
				sample.description = req.body.description;
				await sample.save();
				res.redirect(`/${sample.id}/item`);
			}else{
				res.redirect(400, 'back');
			}
		}
	});
	return sampleController;
}
