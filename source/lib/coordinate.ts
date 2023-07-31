

export interface PointData{
	x:number;
	y:number;
	z:number;
}

export function isPointData(x: unknown): x is PointData {
	if(typeof x !== 'object' || x === null) return false;
	return 'x' in x && typeof x.x === 'number' &&
        'y' in x && typeof x.y === 'number' &&
        'z' in x && typeof x.y === 'number';
}

export interface calibrationSet{
	A:PointData;
	B:PointData;
	C:PointData;
}

