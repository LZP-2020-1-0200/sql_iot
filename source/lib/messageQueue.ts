
import type { JSONValue } from '../config';
import type { PointData} from './coordinate';
import { isPointData } from './coordinate.js';

export type MessagePayload = {
	topic: string;
	body?: JSONValue;
};

export type QueueResponse = {
	"latestId":number;
	"messages":MessagePayload[];
};

export class Message{
	topic: string;
	msg: JSONValue;
	constructor(topic:string, msg:JSONValue){
		this.topic=topic;
		this.msg=msg;
	}
	get data(): MessagePayload{
		const packed:MessagePayload={topic: this.topic, body: this.msg};
		return packed;
	}
}
const defaultTimeout=60*1000*5;
export class MessageQueue{
	private queue:Message[];
	private _lastAccess:number;
	lastPoint: PointData;
	readonly timeout: number;//5 mins //1000*3600*24;//24 hrs in milliseconds
	constructor(resetTime: number = defaultTimeout){
		this.timeout = resetTime;
		this.queue=[];
		this._lastAccess=Date.now();
		this.lastPoint={x:0,y:0,z:0};
	}
	
	public get lastAccess() : number {
		return this._lastAccess;
	}
	
	async locationUpdate(){
		const id = this.getId();
		this.addMessage('point_info?',{});
		for(let i = 0; i < 20; i++){
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
			await new Promise((resolve) => { setTimeout(resolve, 100); });
		}
		return this.lastPoint;
	}

	//checks of timeout period for queue has been reached
	timeUpdate(){
		const now:number = Date.now();
		const delta:number = now-this._lastAccess;
		if(delta>this.timeout){
			this.queue=[];
		}
		this._lastAccess=now;
	}
	getId(){
		this.timeUpdate();
		return this.queue.length;
	}

	/**
     * 
     * @param id 
     * the id of the last received message
     * @param topics 
     * a list of topics 
     */
	*messagesSinceId(id:number, topics:string[] | string | 'all'=[]){
		if(typeof topics=='string'){
			topics=[topics];
		}
		this.timeUpdate();
		for(let it=id;it<this.queue.length;it++){
			if(topics.includes("all") || topics.includes(this.queue[it].topic)){
				yield this.queue[it].data;
			}
		}
	}
	addMessage(topic:string, body:JSONValue){
		this.timeUpdate();
		if(topic=='pointinfo'){
			if(isPointData(body)){
				this.lastPoint=body;
				this.queue.push(new Message(topic, body));
			}
		}else{
			this.queue.push(new Message(topic, body));
		}
	}
}

export const mainQueue: MessageQueue = new MessageQueue();