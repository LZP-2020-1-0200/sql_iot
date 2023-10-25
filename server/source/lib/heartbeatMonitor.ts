


import { MessageQueue, MessageQueueStream } from './messageQueue.js';
import { Message, isHeartbeatMessage } from './messageQueueMessages.js';

interface Device {
	name: string;
	lastHeartbeat: number;
}

type HeartbeatCallback = (deviceId: string) => void;

export class HeartbeatMonitor {
	private devices: Device[] = [];
	private messageQueue: MessageQueue;
	private messageQueueStream: MessageQueueStream;
	private intervalId: NodeJS.Timeout | null = null;
	private callback: HeartbeatCallback;

	constructor(messageQueue: MessageQueue, callback: HeartbeatCallback) {
		this.messageQueue = messageQueue;
		this.messageQueueStream = messageQueue.getStream('heartbeat');
		this.callback = callback;
	}

	public start(): void {
		for(const device of this.devices){
			device.lastHeartbeat = Date.now();
		}
		this.messageQueueStream = this.messageQueue.getStream('heartbeat');
		this.intervalId = setInterval(() => {
			this.checkHeartbeats();
		}, 1000);
	}

	public stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private async checkHeartbeats(): Promise<void> {
		const now = Date.now();
		const devicesToRemove: string[] = [];

		for (const device of this.devices) {
			if (now - device.lastHeartbeat > 60*1000) {
				devicesToRemove.push(device.name);
			}
		}

		for (const deviceName of devicesToRemove) {
			//this.removeDevice(deviceName);
			this.callback(deviceName);
		}

		this.messageQueueStream.consume((message) => {
			if(!isHeartbeatMessage(message)) return;
			const deviceName = message.body.name;
			const device = this.devices.find((d) => d.name === deviceName);
			if (device) {
				device.lastHeartbeat = Date.now();
			} else {
				this.addDevice(deviceName);
			}
		});
	}

	addDevice(deviceName: string): void {
		if(this.devices.find((d) => d.name === deviceName) === undefined) {
			this.devices.push({ 
				name: deviceName, 
				lastHeartbeat: Date.now() 
			});
		} else {
			this.devices.find((d) => d.name === deviceName)!.lastHeartbeat = Date.now();
		}
		
	}

	removeDevice(deviceName: string): void {
		const index = this.devices.findIndex((d) => d.name === deviceName);

		if (index !== -1) {
			this.devices.splice(index, 1);
		}
	}

	clearDevices(): void {
		this.devices = [];
	}
}
