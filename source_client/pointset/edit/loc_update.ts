import $ from 'jquery';
import type { PointData} from '../pointSet.js';
import { set_cal } from '../pointSet.js';
import { isPointData} from '../pointSet.js';
import { fetchPointData } from '../pointSet.js';
import Cookies from 'js-cookie';
import { Psd, dataCals } from '../edit/init.js';

/**
 * Gets the current viewBox parameters
 * Throws an error if the viewBox is not set
 * @returns an object containing viewbox parameters
 */
export function getBox() {
	const coords = $('#ptCanvas').attr('viewBox')?.split(' ');
	if (coords === undefined) throw "Uhhh... no viewBox??";
	return { x: Number(coords[0]), y: Number(coords[1]), w: Number(coords[2]), h: Number(coords[3]) };
}

/**
 * Fetches and calculates the bounds of the viewBox
 * @returns an object containing the min and max bounds of the viewBox
 */
export function getBounds() {
	const box = getBox();
	const x2 = box.x+box.w;
	const y2 = box.y+box.h;
	return {
		min: {
			x: Math.min(box.x, x2),
			y: Math.min(box.y, y2)
		}, 
		max: {
			x: Math.max(box.x, x2),
			y: Math.max(box.y, y2)
		}
	};
}

/**
 * Constrains a point to the viewBox
 */
export function constrainToBox(coord: {x: number; y: number}) {
	const bounds = getBounds();
	return {
		x: Math.min(Math.max(bounds.min.x, coord.x), bounds.max.x),
		y: Math.min(Math.max(bounds.min.y, coord.y), bounds.max.y)
	};
}

/**
 * Generates event listeners for the calibration buttons.
 * The buttons will set the calibration values to the current location.
 * 
 * Relies on elements with ids of 'aBtn', 'bBtn', and 'cBtn'
 * and elements with ids of
 * 'cax', 'cay', 'caz',
 * 'cbx', 'cby', 'cbz',
 * 'ccx', 'ccy', and 'ccz'
 * to exist in the DOM
 */
export function generateCalibrationEvents(){
	(['a', 'b', 'c'] as const).forEach((p) => {
		const btn: `${typeof p}Btn` = (`${p}Btn`);
		const btnElem=document.getElementById(btn);
		if(btnElem !== null){
			btnElem.onclick=(e) => {
				e.preventDefault();
				const cx = document.getElementById(`c${p}x`);
				const cy = document.getElementById(`c${p}y`);
				const cz = document.getElementById(`c${p}z`);
				if(cx !== null && cy !== null && cz !== null){
					if(cx instanceof HTMLInputElement && cy instanceof HTMLInputElement && cz instanceof HTMLInputElement){
						set_cal(cx, cy, cz, p );
					}
				}
				updateLocals();
			};
		}
	});
}

/**
 * The refresh rate in Hz for updating the location marker
 */
const refreshRate = 10;

/**
 * The last time the location was updated
 */
let lastUpdate = Date.now();

/**
 * The last location of the stage
 */
export let lastPoint = {x: 0, y: 0, z: 0};

/**
 * The main loop for updating the location marker
 */
export async function locationUpdateLoop() {
	const p = await fetchPointData();
	if (p!==null){
		// Constrain the point to the viewBox
		const datap = constrainToBox(toDataSpace(p));
		
		// overwrite the z value with 0
		lastPoint = {...datap, z: 0};

		// update the location marker's position
		const marker = $('#locationMarker');
		marker.attr('cx', datap.x);
		marker.attr('cy', datap.y);
	}
	
	// calculate the time since the last update
	const targetDelta = 1/refreshRate;
	const time = Date.now();
	const delta = (time-lastUpdate);
	lastUpdate = time;

	// wait until the next update and call this function again
	const waitTime = Math.max(0, targetDelta-delta);
	setTimeout(locationUpdateLoop, waitTime);
}

export let transformMatrix: number[][] | null = null;

/**
 * Fetches the calibration values from the cookies,
 * and updates the transform matrix for converting from point set space to local space
 */
export function updateLocals(){
	// fetch cookies and parse them
	const A = JSON.parse(Cookies.get('a') ?? '{}');
	const B = JSON.parse(Cookies.get('b') ?? '{}');
	const C = JSON.parse(Cookies.get('c') ?? '{}');
	// update the calibration values in the DOM
	if (isPointData(A)) {
		$('#cax').val(A.x);
		$('#cay').val(A.y);
		$('#caz').val(A.z);
	}
	if (isPointData(B)) {
		$('#cbx').val(B.x);
		$('#cby').val(B.y);
		$('#cbz').val(B.z);
	}
	if (isPointData(C)) {
		$('#ccx').val(C.x);
		$('#ccy').val(C.y);
		$('#ccz').val(C.z);
	}
	// recalculate the transform matrix
	if (isPointData(A) && isPointData(B) && isPointData(C)) {
		const b1: PointData = {x: B.x - A.x, y: B.y - A.y, z: 0};
		const b2: PointData = {x: C.x - A.x, y: C.y - A.y, z: 0};
		const Psr = [
			[b1.x, b2.x],
			[b1.y, b2.y]
		];
		const det = Psr[0][0]*Psr[1][1] - Psr[1][0]*Psr[0][1];
		// det 0 means no bueno
		if(det === 0) return;
		if(Psd === null) return;
		const adj = [
			[Psr[1][1], -Psr[0][1]],
			[-Psr[1][0], Psr[0][0]]
		];
		const Prs = [
			[adj[0][0]/det, adj[0][1]/det],
			[adj[1][0]/det, adj[1][1]/det]
		];
		transformMatrix = [
			[Psd[0][0]*Prs[0][0] + Psd[0][1]*Prs[1][0], Psd[0][0]*Prs[0][1] + Psd[0][1]*Prs[1][1]],
			[Psd[1][0]*Prs[0][0] + Psd[1][1]*Prs[1][0], Psd[1][0]*Prs[0][1] + Psd[1][1]*Prs[1][1]]
		];
	}
	console.log(transformMatrix);
}

/**
 * Converts a point from point set space to local space
 * @param pt The point to convert
 * @returns The point in data space
 */
export function toDataSpace(pt: PointData): PointData{
	const A = JSON.parse(Cookies.get('a') ?? '{}');
	if (transformMatrix === null || dataCals === null || !isPointData(A)) return { x: 0, y: 0, z: 0 };
	return {
		x: dataCals.A.x + transformMatrix[0][0] * (pt.x-A.x) + transformMatrix[0][1] * (pt.y-A.y),
		y: dataCals.A.y + transformMatrix[1][0] * (pt.x-A.x) + transformMatrix[1][1] * (pt.y-A.y),
		z: 0
	};
}
