import express from 'express';
import { Experiment, Pointset } from '../models/index.js';

export const experimentController = express.Router();

/**
 * Experiment index page
 */
experimentController.get('/:pointsetId?', async (req, res) => {
	// Fetch all experiments if no pointset is specified
	// Otherwise, fetch all experiments that contain the specified pointset
	if(req.params.pointsetId === undefined || req.params.pointsetId === null || req.params.pointsetId === ""){
		const experiments = await Experiment.findAll({
			include: [Pointset]
		});
		res.render('experiment/index', {experiments});
		return;
	} else {
		const pointsetId = Number(req.params.pointsetId);
		if(isNaN(pointsetId)){
			res.sendStatus(404);
			return;
		}
		const pointset = await Pointset.findByPk(pointsetId);
		if(pointset === null){
			res.sendStatus(404);
			return;
		}
		const experiments = await Experiment.findAll({
			include: [Pointset],
			where: {
				pointsetId: pointsetId
			}
		});
		res.render('experiment/index', {experiments});
		return;
	}
});

/**
 * Experiment item page
 */
experimentController.get('/item/:id(\\d+)', async (req, res) => {
	const id = Number(req.params.id);
	if(isNaN(id)){
		res.sendStatus(404);
		return;
	}
	const experiment = await Experiment.findByPk(id);
	if(experiment === null){
		res.sendStatus(404);
		return;
	}
	res.render('experiment/item', {experiment});
});

/**
 * Experiment edit page
 */
experimentController.get('/edit/:id(\\d+)', async (req, res) => {
	const id = Number(req.params.id);
	if(isNaN(id)){
		res.sendStatus(404);
		return;
	}
	const experiment = await Experiment.findByPk(id);
	if(experiment === null){
		res.sendStatus(404);
		return;
	}
	res.render('experiment/edit', {experiment});
});

export interface ExperimentFormData {
	name: string;
	description: string;
}

export function isExperimentFormData(arg: unknown): arg is ExperimentFormData {
	if(typeof arg !== 'object' || arg === null){
		return false;
	}
	const obj = arg as Record<string, unknown>;
	if(typeof obj.name !== 'string'){
		return false;
	}
	if(typeof obj.description !== 'string'){
		return false;
	}
	return true;
}

/**
 * Experiment edit submit
 */
experimentController.post('/edit/:id(\\d+)', async (req, res) => {
	if(!isExperimentFormData(req.body)){
		res.sendStatus(400);
		return;
	}
	const id = Number(req.params.id);
	if(isNaN(id)){
		res.sendStatus(404);
		return;
	}
	const experiment = await Experiment.findByPk(id);
	if(experiment === null){
		res.sendStatus(404);
		return;
	}
	experiment.name = req.body.name;
	experiment.description = req.body.description;
	await experiment.save();
	res.redirect(`/experiment/item/${id}`);
});

/**
 * Experiment start panel get
 */
experimentController.get('/start/:id(\\d+)', async (req, res) => {
	const id = Number(req.params.id);
	if(isNaN(id)){
		res.sendStatus(404);
		return;
	}
	const experiment = await Experiment.findByPk(id);
	if(experiment === null){
		res.sendStatus(404);
		return;
	}
	res.render('experiment/start', {experiment});
});