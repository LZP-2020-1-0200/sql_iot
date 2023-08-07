
import express from 'express';
import { Point, Pointset, Sample } from '../models/index.js';
import type { PointData, calibrationSet } from '../lib/coordinate.js';
export const pointsetController = express.Router();

/**
 * Displays the pointset page for a specific sample
 */
pointsetController.get('/:sampleId(\\d+)', async(req, res) => {
	const sampleId = Number(req.params.sampleId);
	const sample = await Sample.findByPk(sampleId, {include:[Pointset], attributes:['id', 'name', 'description']});
	if(sample === null){
		res.send("Invalid sample id");
	}else{
		res.render('pointset/', {sample});
	}
});

/**
 * Displays the add pointset page for a specific sample
 */
pointsetController.get('/:sampleId/add', async (req, res) => {
	const sampleId = Number(req.params.sampleId);
	const sample = await Sample.findByPk(sampleId);
	res.render('pointset/add', {sample});
});

/**
 * The expected form data for adding a pointset
 */
interface pointsetAddForm {
	name: string;
	description: string;
	calAx: number;
	calAy: number;
	calAz: number;
	calBx: number;
	calBy: number;
	calBz: number;
	calCx: number;
	calCy: number;
	calCz: number;
}

/**
 * Type guard for pointsetAddForm
 * @param x the object to check
 * @returns true if the object is a pointsetAddForm
 */
function isPointsetAddForm(x: unknown): x is pointsetAddForm {
	let o = true;
	if( typeof x !== 'object') return false;
	if( x === null) return false;
	if(!('name' in x && typeof x.name === 'string')) return false;
	if(!('description' in x && typeof x.description === 'string')) return false;
	// iterate over all the calibration point coordinates
	(['A', 'B', 'C'] as const).forEach(pt => {
		(['x', 'y', 'z'] as const).forEach(coord => {
			const v:`cal${typeof pt}${typeof coord}` = `cal${pt}${coord}`;
			if(v in x){
				// do a forced cast bc typescript too dumb
				const x2 = x as unknown as Record<typeof v, unknown>;
				if(isNaN(Number(x2[v]))) o=false;
			}else{
				o = false;
			}
		});
	});
	return o;
}

/**
 * Converts the form data to a calibrationSet
 * @param pts the form data
 * @returns Calibration point values as a structured object
 */
function constructCali(pts: pointsetAddForm): calibrationSet{
	const cali: calibrationSet={
		'A': {
			x: pts.calAx,
			y: pts.calAy,
			z: pts.calAz
		},
		'B': {
			x: pts.calBx,
			y: pts.calBy,
			z: pts.calBz
		},
		'C': {
			x: pts.calCx,
			y: pts.calCy,
			z: pts.calCz
		},
	};
	return cali;
}

/**
 * Adds a pointset to a sample.
 * Redirects to the pointset edit page
 */
pointsetController.post('/:sampleId(\\d+)/add', async (req, res) => {
	//res.send(req.body);
	if(isPointsetAddForm(req.body)){

		const sample = await Sample.findByPk(req.params.sampleId);
		if(sample !== null){
			const nPointset = await Pointset.create({
				sampleId: sample.id,
				name: req.body.name,
				description: req.body.description,
				calibration: constructCali(req.body)
			});
			res.cookie('lastPointsetId', nPointset.id);
			res.redirect(`/points/${nPointset.id}/edit`);
			return;
		}
	}
	res.redirect('back');
});

/**
 * Locates the outer bounds of a set of points
 * @param pts The array of points to find the bounds of
 * @returns The min and max points
 */
function findBounds(...pts: PointData[]): {min: PointData; max: PointData} {
	const bounds: {min: PointData; max: PointData} = {
		min: {
			x: 9999999,
			y: 9999999,
			z: 9999999
		},
		max: {
			x: -9999999,
			y: -9999999,
			z: -9999999,
		}
	};
	pts.forEach(pt => {
		bounds.max.x = Math.max(bounds.max.x, pt.x);
		bounds.max.y = Math.max(bounds.max.y, pt.y);
		bounds.max.z = Math.max(bounds.max.z, pt.z);
		bounds.min.x = Math.min(bounds.min.x, pt.x);
		bounds.min.y = Math.min(bounds.min.y, pt.y);
		bounds.min.z = Math.min(bounds.min.z, pt.z);
	});
	return bounds;
}

/**
 * Displays the edit pointset page for a specific pointset
 */
pointsetController.get('/:pointsetId/edit', async (req, res) => {
	const ptsId = Number(req.params.pointsetId);
	console.log(ptsId);
	if(isNaN(ptsId)){
		res.sendStatus(404);
		return;
	}
	const pointSet = await Pointset.findByPk(ptsId, {include: [Point]});
	if(pointSet !== null && pointSet.points !== undefined){
		const bounds = findBounds(
			...pointSet.points,
			pointSet.calibration.A,
			pointSet.calibration.B,
			pointSet.calibration.C);
		const radius = 0.01;
		console.log(bounds);
		res.render('pointset/edit', {pointSet, bounds, radius});
		return;
	}else{
		res.sendStatus(404);
		return;
	}
});

/**
 * Endpoint for editing a pointset's name, description, or calibration points
 */
pointsetController.put('/:pointsetId/edit', async (req, res) => {
	if(isPointsetAddForm(req.body)){
		const pointset = await Pointset.findByPk(req.params.pointsetId);
		if(pointset !== null){
			await pointset.edit(req.body.name, req.body.description, constructCali(req.body));
		}
	}
	res.send("OK");
});