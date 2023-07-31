import Cookie from 'js-cookie';

export interface PointData{
	x:number;
	y:number;
	z:number;
}

/**
 * Type guard for PointData
 * @param x The object to check
 * @returns true if the object is a PointData
 */
export function isPointData(x: unknown): x is PointData {
	if(typeof x !== 'object' || x === null) return false;
	return 'x' in x && typeof x.x === 'number' &&
        'y' in x && typeof x.y === 'number' &&
        'z' in x && typeof x.y === 'number';
}

/**
 * Fetches the latest stage location from the server
 * @returns The latest stage location or null if the location is not available
 */
export async function fetchPointData(): Promise<PointData | null> {
	const locRes = await fetch('/messageQueue/get/location', {
		method: 'GET'
	});
	const location = await locRes.json();
	//console.log(location);
	if(isPointData(location)) return location;
	return null;
}

/**
 * Sets the calibration values for a point
 * @param x The input element that displays the x value
 * @param y The input element that displays the y value
 * @param z The input element that displays the z value
 * @param t Which calibration point to set
 */
export async function set_cal(x: HTMLInputElement, y: HTMLInputElement, z: HTMLInputElement, t: 'a' | 'b' | 'c'){
	console.log('hiii again');
	const btnElem=document.getElementById( `${t}Btn`);
	if(btnElem instanceof HTMLButtonElement)btnElem.disabled=true;
	const ptData = await fetchPointData();
	if( ptData !== null ) {
		x.value = ptData.x.toString();
		y.value = ptData.y.toString();
		z.value = ptData.z.toString();
		set_cal_cookie(t, ptData);
		//console.log(t);
	}
	if(btnElem instanceof HTMLButtonElement)btnElem.disabled=false;
}

/**
 * Sets the calibration values for a point in a cookie to retain
 * the values when the page is reloaded
 * @param t Which calibration point to set
 * @param pt The point data to set
 */
export function set_cal_cookie(t: 'a' | 'b' | 'c', pt: PointData) {
	Cookie.set(t as string, JSON.stringify(pt));
}
