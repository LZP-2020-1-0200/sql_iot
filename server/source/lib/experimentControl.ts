import { Socket } from "socket.io";
import { InstrumentData, MeasureMessage, isInstrumentData, isReadyMessage, isUncalibratedMessage, mainQueue } from "./messageQueue.js";
import { Experiment, Point, Pointset } from "../models/index.js";
import { PointData } from "./coordinate.js";

// TODO: decopule mainQueue from this file

/**
 * Discriminated union type for the result of the sequence
 * ready message collection.
 * 
 * allReady: All mandatory devices have sent a ready message
 * 
 * nonCriticalError: At least one optional device has sent an uncalibrated message
 * 
 * criticalError: At least one mandatory device has sent an uncalibrated message
 */
type SequenceResult = 
{$: 'allReady';

} | 
{$: 'nonCriticalError';
	uncalibratedDeviceNames: string[];
} | 
{$: 'criticalError';
	uncalibratedDeviceName: string;
};

async function collectReadyMessages(sequence: number, requiredInstruments: InstrumentData[], queueStartId: number): Promise<SequenceResult> {
	let queueid = queueStartId;
	let devices = structuredClone(requiredInstruments);
	let messageFetcher = mainQueue.messagesSinceIdAsync(queueStartId, ['ready', 'uncalibrated']);
	const uncalibratedDevices: string[] = [];
	while(devices.length > 0){
		// TODO: Consider adding a fallback break condition or kill switch
		// fetch next message from queue
		let msg = await messageFetcher.next();
		const message = msg.value;
		if(isReadyMessage(message)){
			if(message.body.sequence !== sequence) continue;
			// less efficient than removing from array, but more readable
			devices = devices.filter((device) => device.name !== message.body.name);
		} else if (isUncalibratedMessage(message)){
			// check if the uncalibrated device is required
			if(devices.some((device) => device.name === message.body.name)){
				return {$: 'criticalError',
					uncalibratedDeviceName: message.body.name 
				};
			} else {
				uncalibratedDevices.push(message.body.name);
			}
		}
	}
	if(uncalibratedDevices.length > 0){
		return {$: 'nonCriticalError',
			uncalibratedDeviceNames: uncalibratedDevices
		};
	} else {
		return {$: 'allReady'};
	}
}


export async function launchExperiment(experiment: Experiment, socket: Socket | null = null) {
	const devices = await mainQueue.getDevices();
	const mandatoryDevices: Record<number, InstrumentData[]> = [];
	let tempMaxSequence = 0;
	for (const device of devices) {
		if (device.priority) {
			mandatoryDevices[device.sequence].push(device);
		}
		if(device.sequence > tempMaxSequence){
			tempMaxSequence = device.sequence;
		}
	}
	const maxSequence = tempMaxSequence;
	const pointSet = await Pointset.findByPk(experiment.pointsetId, {include: [Point]});
	if(pointSet === null){
		if(socket !== null){
			socket.emit('error', `Pointset ${experiment.pointsetId} not found`);
		} else {
			console.error(`Pointset ${experiment.pointsetId} not found`);
		}
		return;
	}
	const points = pointSet.points;
	if (points === undefined) {
		if(socket !== null){
			socket.emit('error', `Pointset ${experiment.pointsetId} has no points`);
		} else {
			console.error(`Pointset ${experiment.pointsetId} has no points`);
		}
		return;
	}
	for(let i = 0; i <= points.length; i++){
		let sequence = 0;
		const pointData: PointData = {
			x: points[i].x,
			y: points[i].y,
			z: points[i].z
		}
		while (sequence <= maxSequence) {
			const measureMsg: MeasureMessage = {
				topic: 'measure',
				body: {
					experimentId: experiment.id,
					pointNumber: points[i].pointNumber,
					point: pointData,
					sequence: sequence
				}
			};
			let latestId = mainQueue.getId();
			mainQueue.addMessage(measureMsg);
			let result = await collectReadyMessages(sequence, mandatoryDevices[sequence], latestId);
			if (result.$ === 'criticalError') {
				if(socket !== null){
					socket.emit('error', `Device ${result.uncalibratedDeviceName} is uncalibrated`);
				} else {
					console.error(`Device ${result.uncalibratedDeviceName} is uncalibrated`);
				}
				return;
			} else if (result.$ === 'nonCriticalError'){
				if(socket !== null){
					socket.emit('warning', `Devices ${result.uncalibratedDeviceNames.join(', ')} are uncalibrated`);
				} else {
					console.warn(`Devices ${result.uncalibratedDeviceNames.join(', ')} are uncalibrated`);
				}
			}
			sequence++;
		}
	}
}