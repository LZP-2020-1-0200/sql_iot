import { Socket } from "socket.io";
import { InstrumentData, MeasureMessage, MessageQueue, isHaltExperimentMessage, isInstrumentData, isReadyMessage, isUncalibratedMessage, mainQueue } from "./messageQueue.js";
import { Experiment, Point, Pointset } from "../models/index.js";
import { PointData } from "./coordinate.js";
import EventEmitter from "node:events";

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
 * 
 * halted: The experiment has been halted
 */
/*
type SequenceResult = 
{$: 'allReady';

} | 
{$: 'nonCriticalError';
	uncalibratedDeviceNames: string[];
} | 
{$: 'criticalError';
	uncalibratedDeviceName: string;
} |
{$: 'halted';

};
*/

type SequenceItem = {
	name: string;
	sequence: number;
	priority: boolean;
}

/**
 * A class that keeps track of the current sequence number
 */
export class Sequencer {
	private currentSequence: number;
	private sequencedDevices: Record<number, SequenceItem[]>;
	private waitList: string[];
	private maxSequence: number;
	private notifyCallback: (devices: string[])=>void = ()=>{};

	constructor(){
		this.currentSequence = 0;
		this.sequencedDevices = {};
		this.maxSequence = 0;
		this.waitList = [];
	}
	
	/**
	 * Resets the sequencer to its initial state
	 */
	reset() {
		this.currentSequence = 0;
		this.sequencedDevices = {};
		this.maxSequence = 0;
		this.waitList = [];
	}

	/**
	 * Adds a device to the sequencer
	 * @param device The device to add
	 */
	addDevice(device: SequenceItem){
		if(!this.sequencedDevices.hasOwnProperty(device.sequence)){
			this.sequencedDevices[device.sequence] = [];
		}
		if(device.priority) this.sequencedDevices[device.sequence].push(device);
		if(device.sequence > this.maxSequence){
			this.maxSequence = device.sequence;
		}
	}

	initiate(notifyCallback: (devices: string[])=>void = ()=>{}) {
		this.currentSequence = -1;
		this.notifyCallback = notifyCallback;
		this.incrementSequence();
	}

	/**
	 * Increments the sequence number
	 */
	private incrementSequence(){
		this.currentSequence++;
		while(true) {
			if(this.currentSequence > this.maxSequence) return;
			const devices = this.sequencedDevices[this.currentSequence];
			if(devices === undefined || devices.length === 0){
				this.notifyCallback([]);
				this.currentSequence++;
			} else {
				break;
			}
		}
		this.waitList = this.sequencedDevices[this.currentSequence].map((device) => device.name);
		this.notifyCallback(structuredClone(this.waitList));
	}

	/**
	 * Returns the current sequence number
	 */
	getSequence(){
		return this.currentSequence;
	}

	/**
	 * Returns the wait list
	 */
	getWaitList(){
		return this.waitList;
	}

	/**
	 * Removes a device from the wait list
	 */
	markDeviceAsDone(name: string){
		this.waitList = this.waitList.filter((device) => device != name);
		if(this.waitList.length === 0){
			this.incrementSequence();
		}
	}

	/**
	 * Returns weather the sequencer is done
	 */
	isDone(){
		return this.currentSequence > this.maxSequence;
	}


}

/*
async function collectReadyMessages(sequence: number, requiredInstruments: InstrumentData[], queueStartId: number): Promise<SequenceResult> {
	let queueid = queueStartId;
	let devices = structuredClone(requiredInstruments);
	let messageFetcher = mainQueue.messagesSinceIdAsync(queueStartId, ['ready', 'uncalibrated', 'halt_experiment']);
	const uncalibratedDevices: string[] = [];
	while(devices.length > 0){
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
		} else if (isHaltExperimentMessage(message)){
			return {$: 'halted'};
		} else {
			console.error(`Unexpected message type/malformed message: ${JSON.stringify(message)}`);
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
*/

/**
 * 
 * @param point Point to measure
 * @param experimentId Id of the experiment
 * @param messageQueue Message queue to use
 * @param sequencer Sequencer that has devices added to it
 * @param log Optional log function
 */
export async function sequencePoint(point: PointData, pointNumber: number, experimentId: Experiment["id"], messageQueue: MessageQueue, sequencer: Sequencer, log: (data: string)=>void = ()=>{}): Promise<void> {
	let latestId = messageQueue.getId();
	const readyMessages = messageQueue.messagesSinceIdAsync(latestId, ['ready', 'uncalibrated', 'halt_experiment']);
	
	// initiate sequencer for this point
	sequencer.initiate((devices) => {
		log(`Requesting ${devices} to measure point ${pointNumber}`);
		const measureMsg: MeasureMessage = {
			topic: 'measure',
			body: {
				experimentId,
				point: point,
				pointNumber: pointNumber,
				sequence: sequencer.getSequence()
			}
		};
		messageQueue.addMessage(measureMsg);
	});
	
	// read messages until all devices are ready
	while(!sequencer.isDone()){
		log("Waiting for devices to be ready");
		const message = await readyMessages.next();
		log(`Received message: ${JSON.stringify(message.value)}`);
		if(message.done) {
			log(`Experiment halted unexpectedly`);
			return;
		}
		if(isReadyMessage(message.value)){
			log(`Device ${message.value.body.name} is ready`);
			sequencer.markDeviceAsDone(message.value.body.name);
		} else if (isUncalibratedMessage(message.value)){
			log(`Device ${message.value.body.name} is uncalibrated`);
			return;
		} else if (isHaltExperimentMessage(message.value)){
			log(`Experiment halted`);
			return;
		} else {
			log(`Unexpected message type/malformed message: ${JSON.stringify(message)}`);
			return;
		}
	}
}

/**
 * Sends measure messages to the message queue in sequence
 * @param messageQueue message queue to use
 * @param experimentId Id of the experiment
 * @param points point array to iterate over
 * @param log optional log function
 */
export async function launchSequencedExperiment(messageQueue: MessageQueue, experimentId: Experiment["id"], points: Point[], log: (data: string)=>void = ()=>{}) {
	const sequencer = new Sequencer();
	const devices = await messageQueue.getDevices();
	for (const device of devices) {
		sequencer.addDevice({name: device.name, sequence: device.sequence, priority: device.priority});
	}
	for (let i=0;i<points.length;i++) {
		await sequencePoint(points[i], points[i].pointNumber, experimentId, messageQueue, sequencer, log);
	}
}
/*
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
			} else if (result.$ === 'halted'){
				if(socket !== null){
					socket.emit('warning', `Experiment halted`);
				} else {
					console.warn(`Experiment halted`);
				}
				return;
			} else if (result.$ === 'allReady'){
				if(socket !== null){
					socket.emit('info', {message: `All devices ready`, sequence: sequence, maxSequence: maxSequence});
				} else {
					console.info(`All devices ready`);
				}
			} else {
				if (socket !== null) {
					socket.emit('error', `Unexpected result from collectReadyMessages: ${JSON.stringify(result)}`);
				} else {
					console.error(`Unexpected result from collectReadyMessages: ${JSON.stringify(result)}`);
				}
				return;
			}
			sequence++;
		}
	}
}
*/