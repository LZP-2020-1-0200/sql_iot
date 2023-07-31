/**
 * @module coordinate
 * 
 */


/**
 * Contains the x, y, and z coordinates of a point
 */
export interface PointData{
	x:number;
	y:number;
	z:number;
}

/**
 * Type guard for PointData
 * @param x the object to check
 * @returns {boolean} true if the object is a PointData
 */
export function isPointData(x: unknown): x is PointData {
	if(typeof x !== 'object' || x === null) return false;
	return 'x' in x && typeof x.x === 'number' &&
        'y' in x && typeof x.y === 'number' &&
        'z' in x && typeof x.y === 'number';
}

/**
 * Contains the calibration points for a pointset
 */
export interface calibrationSet{
	A:PointData;
	B:PointData;
	C:PointData;
}

