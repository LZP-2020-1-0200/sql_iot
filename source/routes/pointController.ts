import express from 'express';
import { Point, Pointset } from '../models/index.js';

export const pointController = express.Router();

/**
 * Endpoint for adding a point to a pointset
 */
pointController.post('/:pointsetId/add', async (req, res) => {
	// check if the request body has the required fields
	if(!('x' in req.body && 'y' in req.body && 'z' in req.body)) {
		res.sendStatus(400);
		return;
	}

	// force cast the request body to a point
	const pt = {
		x: Number(req.body.x),
		y: Number(req.body.y),
		z: Number(req.body.z)
	};
	// check if the point is valid
	if(isNaN(pt.x) || isNaN(pt.y) || isNaN(pt.z)) {
		res.sendStatus(400);
		return;
	}
	const ptset = await Pointset.findByPk(req.params.pointsetId);
	// check if the pointset exists
	if(ptset === null) {
		res.sendStatus(400);
		return;
	}
	const maxNumPoint = await Point.findOne({
		where: {
			pointsetId: ptset.id
		},
		order: [['pointNumber', 'DESC']]
	});
	const maxNum = (maxNumPoint?.pointNumber) ?? 0;
	await Point.create({
		pointsetId: ptset.id,
		pointNumber: maxNum+1,
		x: pt.x,
		y: pt.y,
		z: pt.z
	});
	res.sendStatus(200);
	return;

});


/**
 * Endpoint for adding a point to a pointset
 */
pointController.post('/:pointsetId/bulkadd', async (req, res) => {
	// check if the pointset exists
	const ptset = await Pointset.findByPk(req.params.pointsetId);
	if(ptset === null) {
		res.sendStatus(400);
		return;
	}

	// body should be an array of points
	if(!Array.isArray(req.body)) {
		res.sendStatus(400);
		return;
	}

	// check if all array elements are points
	for(const elem of req.body) {
		if(!('x' in elem && 'y' in elem && 'z' in elem)) {
			res.sendStatus(400);
			return;
		}
		const pt = {
			x: Number(elem.x),
			y: Number(elem.y),
			z: Number(elem.z)
		};
		if(isNaN(pt.x) || isNaN(pt.y) || isNaN(pt.z)) {
			res.sendStatus(400);
			return;
		}
	}

	// add all the points
	const maxNumPoint = await Point.findOne({
		where: {
			pointsetId: ptset.id
		},
		order: [['pointNumber', 'DESC']]
	});
	console.log(maxNumPoint);
	const maxNum = (maxNumPoint?.pointNumber) ?? 0;
	for(let i=0; i<req.body.length; i++) {
		const elem = req.body[i];
		await Point.create({
			pointsetId: ptset.id,
			pointNumber: maxNum + 1 + i,
			x: elem.x,
			y: elem.y,
			z: elem.z
		});
	}

	res.sendStatus(200);
	return;
	
});

export function isnumarr(x: unknown[]): x is number[] {
	let good = true;
	x.forEach(elem => {
		good &&= (elem !== null && elem !== undefined && typeof elem === 'number');
	});
	return good;
}

pointController.put('/:pointsetId/edit', async (req, res) => {
	const ptNum = req.body.pointNumber;
	const enabledStatus = req.body.enabled;
	const ptSetId = Number(req.params.pointsetId);
	if (typeof enabledStatus === 'boolean' && !isNaN(ptSetId)) {
		if (Array.isArray(ptNum) && isnumarr(ptNum)){
			const points = await Point.findAll({
				where: {
					pointNumber: ptNum, 
					pointsetId: ptSetId
				}
			});
			// run a for loop instead of forEach because of requiring to await saving
			for (let i=0; i<points.length; i++) {
				const point = points[i];
				point.enabled = enabledStatus;
				await point.save();
			}
			res.sendStatus(200);
			return;
		}
	}
	res.sendStatus(400);
});