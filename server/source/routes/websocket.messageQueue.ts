import { Server } from "socket.io";
import { mainQueue } from "../lib/messageQueue.js";
import { launchExperiment } from "../lib/experimentControl.js";
import { Experiment } from "../models/Experiment.js";
import exp from "constants";
export function websocketSetup(io: Server) {
	io.on('connection', (socket) => {
		console.log('a user connected');
		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
		socket.on('launch', async (msg) => {
			const exId = msg.experimentId;
			const experiment = await Experiment.findByPk(exId);
			if (experiment === null) {
				console.log(`Experiment ${exId} not found`);
				socket.emit('error', `Experiment ${exId} not found`);
				return;
			}
			launchExperiment(experiment, socket);
		});
	});

}