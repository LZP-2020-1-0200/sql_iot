
import type { JSONValue } from '../config.js';
import type { PointData, calibrationSet } from './coordinate.js';
import { isPointData } from './coordinate.js';
/**
 * The payload of a message
 */
export interface MessagePayload {
	topic: string;
	body?: JSONValue;
}

export type MeasureMessage = {
	topic: 'measure';
	body: {
		point: PointData;
		sequence: number;
		pointNumber: number;
		experimentId: number;
	};
}

export type InstrumentPingMessage = {
	topic: 'instrument_ping';
	body: undefined;
}

export type InstrumentDataMessage = {
	topic: 'instrument_data';
	body: {
		sequence: number;
		name: string;
		priority: boolean;
		local_cal: [boolean, boolean, boolean];
		dataset_cal: [boolean, boolean, boolean];
	};
}

export type ReadyMessage = {
	topic: 'ready';
	body: {
		sequence: number;
		name: string;
	};
}

export function isReadyMessage(arg: unknown): arg is ReadyMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as ReadyMessage;
	return obj.topic === 'ready' && 
		typeof obj.body === 'object' && 
		obj.body !== null && 
		typeof obj.body.sequence === 'number' && 
		typeof obj.body.name === 'string';
}

export type CalibrationMessage = {
	topic: 'calibration';
	body: calibrationSet;
}

export type PointInfoQMessage = {
	topic: 'point_info?';
	body: undefined;
}

export type PointInfoMessage = {
	topic: 'point_info';
	body: PointData;
}

export type SetLocalCalMessage = {
	topic: 'set_local_calibration';
	body: {
		point:'A' | 'B' | 'C';
	};
}

export type DataMoveMessage = {
	topic: 'data_move';
	body: PointData;
}

export type MoveMessage = {
	topic: 'move';
	body: PointData;
}

export type UncalibratedMessage = {
	topic: 'uncalibrated';
	body: {
		name: string;
		local: [boolean, boolean, boolean];
		dataset: [boolean, boolean, boolean];
	};
}

export function isUncalibratedMessage(arg: unknown): arg is UncalibratedMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as UncalibratedMessage;
	return obj.topic === 'uncalibrated' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		typeof obj.body.name === 'string' &&	
		Array.isArray(obj.body.local) &&
		obj.body.local.length === 3 &&
		typeof obj.body.local[0] === 'boolean' &&
		typeof obj.body.local[1] === 'boolean' &&
		typeof obj.body.local[2] === 'boolean' &&
		Array.isArray(obj.body.dataset) &&
		obj.body.dataset.length === 3 &&
		typeof obj.body.dataset[0] === 'boolean' &&
		typeof obj.body.dataset[1] === 'boolean' &&
		typeof obj.body.dataset[2] === 'boolean';
}


		


/**
 * Response to a queue request
 */
export type QueueResponse = {
	"latestId":number;
	"messages":MessagePayload[];
};

/**
 * A message to be sent to the queue
 * Contains a topic and a JSON object
 * @param topic The topic of the message
 * @param msg A JSON object containing the message body
 */
export class Message{
	topic: string;
	msg: JSONValue;
	constructor(topic:string, msg:JSONValue){
		this.topic=topic;
		this.msg=msg;
	}

	/**
	 * Returns the message as a MessagePayload for sending 
	 * this message over the network
	 */
	get data(): MessagePayload{
		const packed:MessagePayload={topic: this.topic, body: this.msg};
		return packed;
	}
}

export interface InstrumentData{
	"priority": boolean;
	"name": string;
	"sequence": number;
	"local_cal"?: [boolean, boolean, boolean];
	"dataset_cal"?: [boolean, boolean, boolean];
}

export function isInstrumentData(arg: unknown): arg is InstrumentData {
	if(typeof arg !== 'object' || arg === null){
		return false;
	}
	const obj = arg as Record<string, unknown>;
	if(typeof obj.priority !== 'boolean'){
		return false;
	}
	if(typeof obj.name !== 'string'){
		return false;
	}
	if(typeof obj.sequence !== 'number'){
		return false;
	}
	if(obj.local_cal !== undefined) {
		if(!Array.isArray(obj.local_cal) || obj.local_cal.length !== 3){
			return false;
		}
		for(const x of obj.local_cal){
			if(typeof x !== 'boolean'){
				return false;
			}
		}
	}
	if(obj.dataset_cal !== undefined) {
		if(!Array.isArray(obj.dataset_cal) || obj.dataset_cal.length !== 3){
			return false;
		}
		for(const x of obj.dataset_cal){
			if(typeof x !== 'boolean'){
				return false;
			}
		}
	}
	return true;
};

// TODO: Move constants to a config file or .env
/**
 * The default timeout for the queue reset in milliseconds
 */
const defaultTimeout=60*1000*5;

/**
 * The timeout for the queue location update in milliseconds
 */
export const locationUpdateFetchTimeout = 100;
/**
 * The maximum number of times to try to retrieve the location
 * of the motorized stage
 */
export const locationUpdateMaxTries = 20;

/**
 * Set time to wait for devices to update their status
 * in milliseconds
 * In this time, the ping message should be received by all devices,
 * and they should have sent their status update
 */
const deviceUpdateWaitTime = 1000;

/**
 * A queue of messages that clients can post to and retrieve from.
 * Used as a way to communicate between the server and the clients.
 */
export class MessageQueue{

	//TODO: Refactor to use a dictionary of topics to queues
	/**
	 * The queue of messages
	 */
	private queue:Message[];
	/**
	 * The last time the queue was accessed
	 */
	private _lastAccess:number;

	/**
	 * The last known location of the motorized stage
	 */
	lastPoint: PointData;

	/**
	 * The idle reset time for the queue
	 */
	readonly timeout: number;

	constructor(resetTime: number = defaultTimeout){
		this.timeout = resetTime;
		this.queue=[];
		this._lastAccess=Date.now();
		this.lastPoint={x:0,y:0,z:0};
	}
	
	/**
	 * A getter for the lastAccess property
	 */
	public get lastAccess() : number {
		return this._lastAccess;
	}
	
	/**
	 * Asynchronously retrieves the last known location of the motorized stage.
	 * @returns the last known location of the motorized stage
	 */
	async locationUpdate(){
		const id = this.getId();
		this.addMessage('point_info?',{});
		for(let i = 0; i < locationUpdateMaxTries; i++){
			const x = this.messagesSinceId(id, 'point_info').next();
			if(!x.done){
				if(x.value.body !== undefined && typeof x.value.body === 'object' &&
					'x' in x.value.body && 'y' in x.value.body && 'z' in x.value.body &&
					typeof x.value.body.x === 'number' && typeof x.value.body.y === 'number' &&
					typeof x.value.body.z === 'number') {
					this.lastPoint.x = x.value.body.x;
					this.lastPoint.y = x.value.body.y;
					this.lastPoint.z = x.value.body.z;
					break;
				}
			}
			await new Promise((resolve) => { setTimeout(resolve, locationUpdateFetchTimeout); });
		}
		return this.lastPoint;
	}

	/**
	 * Asynchronously retrieves all connected devices by requesting
	 * all devices to update their status
	 * @returns a list of all connected devices
	 */
	async getDevices(): Promise<InstrumentData[]>{
		const id = this.getId();
		// issue a ping to all devices
		this.addMessage('instrument_ping',{});
		const devices: InstrumentData[] = [];
		// wait for all devices to update their status
		await new Promise((resolve) => { setTimeout(resolve, deviceUpdateWaitTime); });
		// retrieve all messages since the ping
		for(const msg of this.messagesSinceId(id, 'instrument_data')){
			console.log(msg);
			if(isInstrumentData(msg.body)){
				devices.push(msg.body);
			}
		}
		return devices;
	}

	/**
	 * Resets the queue if the timeout has been exceeded
	 * If the timeout has not been exceeded, the lastAccess property is updated
	 */
	timeUpdate(){
		const now:number = Date.now();
		const delta:number = now-this._lastAccess;
		if(delta>this.timeout){
			this.clear();
		}
		this._lastAccess=now;
	}

	/**
	 * Clears the queue
	 */
	clear(){
		this.queue=[];
	}

	/**
	 * Accesses the queue and returns the id of the last received message
	 * @returns {number} the id of the last received message
	 */
	getId(): number{
		this.timeUpdate();
		return this.queue.length;
	}

	/**
     * A generator that yields messages since the last received message, ends when the queue is empty
     * @param id 
     * the id of the last received message
     * @param topics 
     * a list of topics
	 * @returns {Generator<MessagePayload>} a generator that
	 * yields messages since the last received message
     */
	*messagesSinceId(id:number, topics:string[] | string): Generator<MessagePayload> {
		if(typeof topics=='string'){
			topics=[topics];
		}
		for(let it=id;it<this.queue.length;it++){
			if(topics.includes("all") || topics.includes(this.queue[it].topic)){
				this.timeUpdate();
				yield this.queue[it].data;
			}
		}
	}

	/**
	 * Asynchronously retrieves messages since the given id
	 * if the queue is empty, waits until a message is received
	 * this generator will never end
	 * @param id
	 * the id of the last received message
	 * @param topics
	 * a list of topics
	 * 
	 */
	async *messagesSinceIdAsync(id:number, topics:string[] | string): AsyncGenerator<MessagePayload, never> {
		if(typeof topics=='string'){
			topics=[topics];
		} else if (typeof topics == 'undefined') {
			topics = ['all'];
		}
		let index = id;
		while(true) {
			if(index >= this.queue.length) {
				// TODO: move timeout length to .env
				await new Promise((resolve) => { setTimeout(resolve, 100); });
				continue;
			}
			if(topics.includes("all") || topics.includes(this.queue[index].topic)){
				this.timeUpdate();
				yield this.queue[index].data;
			}
			index++;
		}
	}

	/**
	 * Pushes a message to the queue with topic+body
	 * @param topic The topic of the message
	 * @param body A JSON object containing the message body
	 */
	private addMessageTB(topic:string, body:JSONValue | undefined) {
		this.timeUpdate();
		const message:Message = new Message(topic, (body === undefined) ? {} : structuredClone(body));
		if(topic=='pointinfo'){
			if(isPointData(body)){
				this.lastPoint=body;
			}
		}
		this.queue.push(message);
	}

	/**
	 * Pushes a message to the queue with a MessagePayload
	 * @param payload The message payload
	 */
	private addMessageP(payload: MessagePayload) {
		this.addMessageTB(payload.topic, payload.body);
	}

	addMessage(topic: string, body: JSONValue): void;
	addMessage(payload: MessagePayload): void;
	addMessage(topicOrPayload: string | MessagePayload, body?: JSONValue) {
		if(typeof topicOrPayload == 'string') {
			this.addMessageTB(topicOrPayload, body);
		} else {
			this.addMessageP(topicOrPayload);
		}
	}
}

/**
 * The main message queue. Used by the server to communicate with the clients.
 */
export const mainQueue: MessageQueue = new MessageQueue();