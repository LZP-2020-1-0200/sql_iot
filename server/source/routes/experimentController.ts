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
experimentController.get('/item/:id', async (req, res) => {
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
experimentController.get('/edit/:id', async (req, res) => {
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