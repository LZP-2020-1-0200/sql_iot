
import type { JSONValue } from '../config.js';
import type { PointData, calibrationSet } from './coordinate.js';
import { isPointData } from './coordinate.js';
import { InstrumentData, Message as Message, isInstrumentData } from './messageQueueMessages.js';

import { messageQueue as config } from '../config.js';
		


/**
 * Response to a queue request
 */
export type QueueResponse = {
	"latestId":number;
	"messages":Message[];
};

/**
 * A message to be sent to the queue
 * Contains a topic and a JSON object
 * @param topic The topic of the message
 * @param msg A JSON object containing the message body
 */
export class TopicMessage{
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
	get data(): Message{
		const packed:Message={topic: this.topic, body: this.msg};
		return packed;
	}
}


/**
 * The default timeout for the queue reset in milliseconds
 */
const defaultTimeout=config.defaultTimeout;

/**
 * The timeout for the queue location update in milliseconds
 */
export const locationUpdateFetchTimeout = config.locationUpdateFetchTimeout;
/**
 * The maximum number of times to try to retrieve the location
 * of the motorized stage
 */
export const locationUpdateMaxTries = config.locationUpdateMaxTries;

/**
 * Set time to wait for devices to update their status
 * in milliseconds
 * In this time, the ping message should be received by all devices,
 * and they should have sent their status update
 */
const deviceUpdateWaitTime = config.deviceUpdateWaitTime;

/**
 * The maximum size of the queue
 */
const maxQueueSize = config.maxQueueSize;

/**
 * A factor of the maxQueueSize to trim the queue to when it overflows
 */
const queueOverflowTrim = config.queueOverflowTrim;

/**
 * The size to trim the queue to when it overflows
 */
const queueOverflowTrimSize = Math.floor(maxQueueSize * queueOverflowTrim);

/**
 * A stream of messages from a MessageQueue
 */
export class MessageQueueStream {
	private queue: MessageQueue;
	private startId: number;
	private generator: Generator<Message, number>;
	private nextValue: IteratorResult<Message, number>;
	private filter: string[] | string;
	constructor(queue: MessageQueue, filter: string[] | string = 'all') {
		this.queue = queue;
		this.startId = queue.getId();
		this.nextValue = { done: true, value: this.startId };
		this.generator = this.queue.messagesSinceId(this.startId, filter);
		this.filter = filter;
	}

	/**
	 * Fetches the next message from the queue.
	 * If the queue is empty, returns null.
	 * Just because the queue is empty does not mean that
	 * the stream is done. It will return null until a new
	 * message is added to the queue.
	 * @returns 
	 */
	next(): Message | null {
		this.nextValue = this.generator.next();
        if(this.nextValue.done) {
            this.startId = this.nextValue.value;
            this.generator = this.queue.messagesSinceId(this.startId, this.filter);
            return null;
        }
        return this.nextValue.value;
	}

	/**
	 * Consumes the entire queue, calling the callback for each message
	 * @param callback Function to call for each message in the queue
	 */
	consume(callback: (message: Message) => void): void {
		while (true){
			const next = this.next();
			if(next === null) return;
			callback(next);
		}
	}


}


/**
 * A queue of messages that clients can post to and retrieve from.
 * Used as a way to communicate between the server and the clients.
 */
export class MessageQueue{
	/**
	 * The queue of messages
	 */
	private queue:TopicMessage[];
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

	/**
	 * Callbacks to fire upon receiving a message
	 */
	private onMessageCallbacks: (() => void)[] = [];

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

	getStream(filter: string[] | string = 'all'): MessageQueueStream {
		return new MessageQueueStream(this, filter);
	}

	/**
     * A generator that yields messages since the last received message, ends when the queue is empty
     * @param id 
     * the id of the last received message
     * @param topics 
     * a list of topics
	 * @returns {Generator<Message>} a generator that
	 * yields messages since the last received message
     */
	*messagesSinceId(id:number, topics:string[] | string): Generator<Message, number> {
		if(typeof topics=='string'){
			topics=[topics];
		}
		for(let it=id;it<this.queue.length;it++){
			if(topics.includes("all") || topics.includes(this.queue[it].topic)){
				this.timeUpdate();
				yield this.queue[it].data;
			}
		}
		return this.getId();
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
	async *messagesSinceIdAsync(id:number, topics:string[] | string): AsyncGenerator<Message, never> {
		if(typeof topics=='string'){
			topics=[topics];
		} else if (typeof topics == 'undefined') {
			topics = ['all'];
		}
		let index = id;
		while(true) {
			if(index >= this.queue.length) {
				// push a callback to the onMessageCallbacks array and wait for it to be called upon receiving a message
				await new Promise((resolve) => { this.onMessageCallbacks.push(()=>{ resolve(undefined); }); });
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
		const message:TopicMessage = new TopicMessage(topic, (body === undefined) ? {} : structuredClone(body));
		// special behavior for pointinfo messages
		// TODO: bad practice, should be handled differently
		if(topic=='pointinfo'){
			if(isPointData(body)){
				this.lastPoint=body;
			}
		}
		// TODO: Add tests for this
		this.queue.push(message);
		if(this.queue.length>maxQueueSize){
			this.queue = this.queue.splice(0,queueOverflowTrimSize);
		}
	}

	/**
	 * Pushes a message to the queue with a MessagePayload
	 * @param payload The message payload
	 */
	private addMessageP(payload: Message) {
		this.addMessageTB(payload.topic, payload.body);
	}

	addMessage(topic: string, body: JSONValue): void;
	addMessage(payload: Message): void;
	addMessage(topicOrPayload: string | Message, body?: JSONValue) {
		if(typeof topicOrPayload == 'string') {
			this.addMessageTB(topicOrPayload, body);
		} else {
			this.addMessageP(topicOrPayload);
		}
		this.onMessageCallbacks.forEach((callback) => { callback(); });
		this.onMessageCallbacks = [];
	}
}

/**
 * The main message queue. Used by the server to communicate with the clients.
 */
export const mainQueue: MessageQueue = new MessageQueue();