// TODO: Nahranizet sito datni

import { Server } from "socket.io";
import { mainQueue } from "../lib/messageQueue.js";
import { Experiment } from "../models/Experiment.js";
import exp from "constants";
import { Point } from "../models/Point.js";
import { Pointset } from "../models/Pointset.js";
export function websocketSetup(io: Server) {
	io.on('connection', (socket) => {
		console.log('a user connected');
		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
		socket.on('launch', async (msg) => {
			const exId = msg.experimentId;
			const experiment = await Experiment.findByPk(exId, {include: [Pointset, Point]});
			if (experiment === null) {
				console.log(`Experiment ${exId} not found`);
				socket.emit('error', `Experiment ${exId} not found`);
				return;
			}
			//launchSequencedExperiment(mainQueue, experiment.id, experiment.pointset?.points ?? [], (data)=>socket.emit('log', data));
		});
		socket.on('log', (msg) => {
			console.log(msg);
		});
	});

}