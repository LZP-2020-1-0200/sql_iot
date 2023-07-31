import express from 'express';
import { Point, Pointset } from '../models/index.js';

export const pointController = express.Router();

pointController.post('/:pointsetId/add', async (req, res) => {
	console.log(req.body);
	if('x' in req.body && 'y' in req.body && 'z' in req.body) {
		const pt = {
			x: Number(req.body.x),
			y: Number(req.body.y),
			z: Number(req.body.z)
		};
		if(!isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z)){
			const ptset = await Pointset.findByPk(req.params.pointsetId);
			if (ptset!==null) {
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
			}
		}
	}
	res.sendStatus(400);
	
});

function isnumarr(x: unknown[]): x is number[] {
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