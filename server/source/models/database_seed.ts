import { sys } from 'typescript';
import {Measurement, Pointset, Sample,  sequelize} from '.';
import { Point } from './Point.js';
import { Experiment } from './Experiment.js';

// when launching this script, it runs through the sequelize models, constructing them in the process should they be non-functional
// when launching with --seed, also seeds the database

if(sys.args.includes("--seed")){
	const x = async ()=>{
		await sequelize.sync();
		const sample = await Sample.create({
			name: 'Test sample 1'
		});
		const sample2 = await Sample.create({
			name: 'Test sample 2'
		});
		const pointset1 = await Pointset.create({
			name: "test pointset 1",
			sampleId: sample.id,
			calibration:{
				A:{x:0, y:0, z:0},
				B:{x:10000, y:0, z:0},
				C:{x:0, y:10000, z:0}
			},
			description:"some point set description"
		});
		await Pointset.create({
			name: "test pointset 1.1",
			sampleId: sample.id,
			calibration:{
				A:{x:0, y:0, z:0},
				B:{x:10000, y:0, z:0},
				C:{x:0, y:10000, z:0}
			},
			description:"some other point set description"
		});
		await Pointset.create({
			name: "test pointset 2",
			sampleId: sample2.id,
			calibration:{
				A:{x:0, y:0, z:0},
				B:{x:10000, y:0, z:0},
				C:{x:0, y:10000, z:0}
			},
			description:"some point set description"
		});
		await Point.bulkCreate([
			{pointsetId:pointset1.id, pointNumber:1, x:1000, y:1000, z:0},
			{pointsetId:pointset1.id, pointNumber:2, x:2000, y:1000, z:0},
			{pointsetId:pointset1.id, pointNumber:3, x:3000, y:1000, z:0},
			{pointsetId:pointset1.id, pointNumber:4, x:4000, y:1000, z:0},
			{pointsetId:pointset1.id, pointNumber:5, x:1000, y:2000, z:0},
			{pointsetId:pointset1.id, pointNumber:6, x:2000, y:2000, z:0},
			{pointsetId:pointset1.id, pointNumber:7, x:3000, y:2000, z:0},
			{pointsetId:pointset1.id, pointNumber:8, x:4000, y:2000, z:0},
		]);
		const ex1 = await Experiment.create({
			name: "test ex 1",
			pointsetId: pointset1.id,
		});
		const measure = await Measurement.create({
			experimentId: ex1.id,
			filename:"none",
			pointNumber:6,
		});
		const pt = (await measure.point());
		console.log(pt?.x, pt?.y);

		await sequelize.sync();
	};
	x().then(()=>console.log("Seeded."));
}else{
	console.log("Generated.");
}