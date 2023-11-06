import expressWs from "express-ws";
import express from "express";
import multer from "multer";
import { Experiment, Measurement, Point, Pointset } from "../models/index.js";

import path from "path";

const FILE_STORAGE_PATH = "uploads/";

export default function (wsInstance: expressWs.Instance): expressWs.Router {
	const measurementController = express.Router();
	wsInstance.applyTo(measurementController);
	
	var storage = multer.diskStorage({
		destination: function (req, file, cb) {
		  cb(null, FILE_STORAGE_PATH)
		},
		filename: function (req, file, cb) {
		  cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
		}
	});
	
	const upload = multer({
		limits: {
			fileSize: 100_000,
		},
		storage
	});
	
	type MeasurementData = {
		experimentId: number;
		pointNumber: number;
		
	}
	
	function isMeasurementData(x: unknown): x is MeasurementData {
		if(typeof x !== 'object') return false;
		if(x === null) return false;
		if(!('experimentId' in x && typeof x.experimentId === 'number' && !isNaN(x.experimentId))) return false;
		if(!('pointNumber' in x && typeof x.pointNumber === 'number' && !isNaN(x.pointNumber))) return false;
		return true;
	}

	measurementController.post('/upload', upload.single('file'), async (req, res) => {
		// save the file in a temporary location, then
		// upload an entry to the database, then
		// fetch the entry data and move the file to the correct location
		// with the correct name for the entry
		req.body.experimentId = req.body.experimentId && Number(req.body.experimentId);
		req.body.pointNumber = req.body.pointNumber && Number(req.body.pointNumber);
		// check if the request is valid
		if(!isMeasurementData(req.body)){
			res.status(400);
			res.send("Invalid request body");
			return;
		}
		// check if the file is valid
		if(req.file === undefined){
			res.status(400);
			res.send("Invalid file");
			return;
		}

		// check if the experiment exists
		const experiment = await Experiment.findByPk(req.body.experimentId);
		if(experiment === null){
			res.status(400);
			res.send("Invalid experiment id");
			return;
		}

		
		const point = await Point.findOne({where: {pointsetId: experiment.pointsetId, pointNumber: req.body.pointNumber}});
		if(point === null){
			res.status(400);
			res.send("Invalid point number");
			return;
		}
		
		// add entry to database
		await Measurement.create({
			experimentId: experiment.id,
			pointNumber: point.pointNumber,
			filename: path.resolve(req.file.path)
		});

		res.sendStatus(200);

	});

	return measurementController;
}