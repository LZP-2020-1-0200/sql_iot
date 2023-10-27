import { MessageQueue } from "./messageQueue.js";
import { Experiment, Point, Pointset } from "../models/index.js";
import { PointData } from "./coordinate.js";
import { HeartbeatMessage, InstrumentData, MeasureMessage, Message, isHaltExperimentMessage, isReadyMessage, isUncalibratedMessage } from "./messageQueueMessages.js";
import { SequenceItem, Sequencer } from "./sequencer.js";
import { HeartbeatMonitor } from "./heartbeatMonitor.js";
import type WebSocket from "ws";



type StatusMessage = {
	$: 'debug',
	data: any
} | {
	$: 'error',
	data: string
} | {
	$: 'success',
	data: string
};

export class ExperimentController {
	private messageQueue: MessageQueue;
	private sequencer: Sequencer;
	private experimentId: Experiment["id"] = 0;
	private points: Point[] = [];
	private log: (data: any)=>void = ()=>{};
	private heartbeatMonitor: HeartbeatMonitor;
	private ws: WebSocket;

	constructor(messageQueue: MessageQueue, websocket: WebSocket){
		this.messageQueue = messageQueue;
		this.sequencer = new Sequencer();
		this.ws = websocket;
		this.heartbeatMonitor = new HeartbeatMonitor(messageQueue, (name) => {
			this.log(`Device ${name} has not sent a heartbeat`);
			websocket.send(JSON.stringify({type:'error', data: `Device ${name} has not sent a heartbeat`}));
		});
	}

	setLogger(log: (data: string)=>void){
		this.log = log;
	}

	async setExperiment(experiment: Experiment) {
		this.experimentId = experiment.id;
		const pointset = await Pointset.findByPk(experiment.pointsetId, {include: [Point]});
		if(pointset === null){
			throw new Error(`Experiment ${experiment.id} has no pointset`);
		}
		const points = pointset.points;
		if(points === null || points === undefined){
			throw new Error(`Experiment ${experiment.id} has no points`);
		}
		this.points = points;
	}

	private async locateDevices(){
		// fetch all devices and pack them into the sequencer
		const devices = await this.messageQueue.getDevices();
		const deviceBySequence: InstrumentData[][] = [];
		for(const device of devices){
			const sequence = device.sequence;
			if(deviceBySequence.length <= sequence){
				for(let i=deviceBySequence.length;i<=sequence;i++){
					deviceBySequence.push([]);
				}
			}
			if(deviceBySequence[sequence] === undefined){
				deviceBySequence[sequence] = [];
			}
			deviceBySequence[sequence].push(device);
		}
		//console.log('Devices by sequence: ', deviceBySequence);
		// construct SequenceItems
		const sequenceItems = deviceBySequence.map((devices, index) => {
			const sequenceItem: SequenceItem = {
				optional: [],
				required: []
			};
			for(const device of devices){
				if(device.priority) {
					sequenceItem.required.push(device.name);
				} else {
					sequenceItem.optional.push(device.name);
				}
			}
			return sequenceItem;
		});
		//console.log('Sequence items: ', sequenceItems);
		this.sequencer.loadSequence(sequenceItems);

		// add devices to heartbeat monitor
		this.heartbeatMonitor.clearDevices();
		for(const device of devices){
			this.heartbeatMonitor.addDevice(device.name);
		}

	}

	/**
	 * Starts the experiment
	 */
	async startExperiment(){
		
		this.log(`Starting experiment ${this.experimentId}`);
		await this.locateDevices();
		this.log(`Devices located`);

		this.heartbeatMonitor.start();
		this.log(`Heartbeat monitor started`);
		for (let i=0;i<this.points.length;i++) {
			this.log(`Measuring point ${this.points[i].pointNumber}`);
			await this.sequencePoint(this.points[i]);
		}
		this.heartbeatMonitor.stop();
		this.log(`Heartbeat monitor stopped`);
		this.log(`Experiment ${this.experimentId} finished`);
	}

	/**
	 * Fires a halt message to all devices
	 */
	haltExperiment(){
		this.messageQueue.addMessage({
			topic: 'halt_experiment',
			body: {
				experimentId: this.experimentId
			}
		});
	}
	

	/**
	 * 
	 * @param point Point to measure
	 * @param experimentId Id of the experiment
	 * @param messageQueue Message queue to use
	 * @param sequencer Sequencer that has devices added to it
	 * @param log Optional log function
	 */
	async sequencePoint(point: Point): Promise<void> {
		let latestId = this.messageQueue.getId();
		const readyMessages = this.messageQueue.messagesSinceIdAsync(latestId, ['ready', 'uncalibrated', 'halt_experiment']);
		
		// initiate sequencer for this point
		this.sequencer.onMeasure = (device) => {
			this.ws.send(JSON.stringify({type:'info', data: `Requesting ${device} to measure point ${point.pointNumber}`}));
			this.log(`Requesting ${device} to measure point ${point.pointNumber}`);
		};
		this.sequencer.onSequence = (sequenceIndex) => {
			const measureMsg: MeasureMessage = {
				topic: 'measure',
				body: {
					experimentId: this.experimentId,
					point: {x: point.x, y: point.y, z: point.z} as PointData,
					pointNumber: point.pointNumber,
					sequence: sequenceIndex
				}
			};
			this.messageQueue.addMessage(measureMsg);
			this.log(`Message sent`);
		};
		this.sequencer.start();
		
		// read messages until all devices are ready
		while(!this.sequencer.isDone()){
			this.log("Waiting for devices to be ready");
			const message = await readyMessages.next();
			this.log(`Received message ${JSON.stringify(message)}`);
			if(message.done) {
				// Should not happen as the generator should not end
				this.log(`Experiment halted unexpectedly`);
				return;
			}
			const payload = message.value;
			this.log(`Received message ${JSON.stringify(payload)}`);
			if(isReadyMessage(payload)){
				this.ws.send(JSON.stringify({type:'info', data: `Device ${payload.body.name} is ready`}));
				this.sequencer.markReady(payload.body.name);
			} else if (isUncalibratedMessage(payload)){
				return;
			} else if (isHaltExperimentMessage(payload)){
				return;
			}
		}
	}
}

