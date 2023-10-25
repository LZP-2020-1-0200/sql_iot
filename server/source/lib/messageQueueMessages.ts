import type { JSONValue } from '../config.js';
import { PointData, calibrationSet as CalibrationSet, isPointData } from './coordinate.js';
/**
 * The payload of a message
 */
export interface Message {
	topic: string;
	body?: JSONValue;
}
export function isMessagePayload(arg: unknown): arg is Message {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as Record<string, unknown>;
	if (typeof obj.topic !== 'string') {
		return false;
	}
	if (typeof obj.body !== 'object' || obj.body === null) {
		return false;
	}
	obj.body = obj.body as JSONValue;
	return true;
}

/**
 * Measurement message type
 * 
 * topic: 'measure'
 */
export interface MeasureMessage extends Message {
	topic: 'measure';
	body: {
		point: PointData;
		sequence: number;
		pointNumber: number;
		experimentId: number;
	};
}

/**
 * Measurement message type guard
 * @param arg 
 * @returns 
 */
export function isMeasureMessage(arg: unknown): arg is MeasureMessage {
	if(!isMessagePayload(arg)){
		return false;
	}
	const obj = arg as MeasureMessage;
	return obj.topic === 'measure' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		isPointData(obj.body.point) &&
		typeof obj.body.sequence === 'number' &&
		typeof obj.body.pointNumber === 'number' &&
		typeof obj.body.experimentId === 'number';
}

/**
 * Instrument ping message type
 */
export interface InstrumentPingMessage extends Message {
	topic: 'instrument_ping';
	body: {};
}

/**
 * Is instrument ping message type guard
 * @param arg 
 * @returns 
 */
export function isInstrumentPingMessage(arg: unknown): arg is InstrumentPingMessage {
	if(!isMessagePayload(arg)){
		return false;
	}
	const obj = arg as InstrumentPingMessage;
	return obj.topic === 'instrument_ping' &&
		typeof obj.body === 'object' &&
		obj.body !== null;
}

/**
 * Instrument data message type
 */
export interface InstrumentDataMessage extends Message {
	topic: 'instrument_data';
	body: {
		sequence: number;
		name: string;
		priority: boolean;
		local_cal: [boolean, boolean, boolean];
		dataset_cal: [boolean, boolean, boolean];
	};
}

/**
 * Instrument data message type guard
 * @param arg 
 * @returns 
 */
export function isInstrumentDataMessage(arg: unknown): arg is InstrumentDataMessage {
	if(!isMessagePayload(arg)){
		return false;
	}
	const obj = arg as InstrumentDataMessage;
	return obj.topic === 'instrument_data' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		typeof obj.body.sequence === 'number' &&
		typeof obj.body.name === 'string' &&
		typeof obj.body.priority === 'boolean' &&
		Array.isArray(obj.body.local_cal) &&
		obj.body.local_cal.length === 3 &&
		typeof obj.body.local_cal[0] === 'boolean' &&
		typeof obj.body.local_cal[1] === 'boolean' &&
		typeof obj.body.local_cal[2] === 'boolean' &&
		Array.isArray(obj.body.dataset_cal) &&
		obj.body.dataset_cal.length === 3 &&
		typeof obj.body.dataset_cal[0] === 'boolean' &&
		typeof obj.body.dataset_cal[1] === 'boolean' &&
		typeof obj.body.dataset_cal[2] === 'boolean';
}

/**
 * Heartbeat message type
 */
export interface HeartbeatMessage extends Message {
	topic: 'heartbeat';
	body: {
		name: string;
	};
}

/**
 * Heartbeat message type guard
 * @param arg 
 * @returns 
 */
export function isHeartbeatMessage(arg: unknown): arg is HeartbeatMessage {
	if(!isMessagePayload(arg)){
		return false;
	}
	const obj = arg as HeartbeatMessage;
	return obj.topic === 'heartbeat' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		typeof obj.body.name === 'string';
}

/**
 * Ready message type
 */
export interface ReadyMessage extends Message {
	topic: 'ready';
	body: {
		sequence: number;
		name: string;
	};
}

/**
 * Ready message type guard
 * @param arg 
 * @returns 
 */
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

/**
 * Calibration message type
 */
export interface CalibrationMessage extends Message {
	topic: 'calibration';
	body: CalibrationSet;
}

/**
 * Calibration message type guard
 */
export function isCalibrationMessage(arg: unknown): arg is CalibrationMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as CalibrationMessage;
	return obj.topic === 'calibration' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		isPointData(obj.body.A) &&
		isPointData(obj.body.B) &&
		isPointData(obj.body.C);
}

/**
 * Point information query message type
 */
export interface PointInfoQMessage extends Message {
	topic: 'point_info?';
	body: {};
}

/**
 * Point information query message type guard
 */
export function isPointInfoQMessage(arg: unknown): arg is PointInfoQMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as PointInfoQMessage;
	return obj.topic === 'point_info?' &&
		typeof obj.body === 'object' &&
		obj.body !== null;
}

/**
 * Point information message type
 */
export interface PointInfoMessage extends Message {
	topic: 'point_info';
	body: PointData;
}

/**
 * Point information message type guard
 */
export function isPointInfoMessage(arg: unknown): arg is PointInfoMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as PointInfoMessage;
	return obj.topic === 'point_info' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		isPointData(obj.body);
}

/**
 * Setting of local calibration message type
 */
export interface SetLocalCalMessage extends Message {
	topic: 'set_local_calibration';
	body: {
		point:'A' | 'B' | 'C';
	};
}

/**
 * Setting of local calibration message type guard
 */
export function isSetLocalCalMessage(arg: unknown): arg is SetLocalCalMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as SetLocalCalMessage;
	return obj.topic === 'set_local_calibration' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		typeof obj.body.point === 'string' &&
		(obj.body.point === 'A' || obj.body.point === 'B' || obj.body.point === 'C');
}

/**
 * Setting of dataset calibration message type
 */
export interface DataMoveMessage extends Message {
	topic: 'data_move';
	body: PointData;
}

/**
 * Setting of dataset calibration message type guard
 */
export function isDataMoveMessage(arg: unknown): arg is DataMoveMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as DataMoveMessage;
	return obj.topic === 'data_move' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		isPointData(obj.body);
}

/**
 * Move message type
 */
export interface MoveMessage extends Message {
	topic: 'move';
	body: PointData;
}

/**
 * Move message type guard
 */
export function isMoveMessage(arg: unknown): arg is MoveMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as MoveMessage;
	return obj.topic === 'move' &&
		typeof obj.body === 'object' &&
		obj.body !== null &&
		isPointData(obj.body);
}

/**
 * Uncalibrated message type
 */
export interface UncalibratedMessage extends Message {
	topic: 'uncalibrated';
	body: {
		name: string;
		local: [boolean, boolean, boolean];
		dataset: [boolean, boolean, boolean];
	};
}

/**
 * Uncalibrated message type guard
 * @param arg 
 * @returns 
 */
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

export interface HaltExperimentMessage extends Message {
	topic: 'halt_experiment';
	body: {};
};

export function isHaltExperimentMessage(arg: unknown): arg is HaltExperimentMessage {
	if (typeof arg !== 'object' || arg === null) {
		return false;
	}
	const obj = arg as HaltExperimentMessage;
	return obj.topic === 'halt_experiment';
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