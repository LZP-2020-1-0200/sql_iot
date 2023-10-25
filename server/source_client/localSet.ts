
type Point = {
	x: number;
	y: number;
	z: number;
}

function isPoint(obj: any): obj is Point {
	return 'x' in obj && 'y' in obj && 'z' in obj &&
		typeof obj.x === 'number' && typeof obj.y === 'number' &&
		typeof obj.z === 'number';
}

type SetPoint = {
	data: Point;
	number: number;
	enabled: boolean;
}

function isSetPoint(obj: any): obj is SetPoint {
	return 'data' in obj && 'number' in obj && 'enabled' in obj &&
		isPoint(obj.data) && typeof obj.number === 'number' &&
		typeof obj.enabled === 'boolean';
}

type Pointset = {
	id: number;
	name: string;
	points: SetPoint[];
	calibration: {
		A: Point;
		B: Point;
		C: Point;
	};
	sampleId: number;
}

function isPointset(obj: any): obj is Pointset {
	return 'id' in obj && 'name' in obj && 'points' in obj &&
		'calibration' in obj && 'sampleId' in obj &&
		typeof obj.id === 'number' && typeof obj.name === 'string' &&
		Array.isArray(obj.points) && obj.points.every(isSetPoint) &&
		isPoint(obj.calibration.A) && isPoint(obj.calibration.B) &&
		isPoint(obj.calibration.C) && typeof obj.sampleId === 'number';
}

type LocalStorage = {
	liveCalibrationPoints: {
		'A': Point;
		'B': Point;
		'C': Point;
	},
	pointset: Pointset;
}

function isLocalStorage(obj: any): obj is LocalStorage {
	return 'liveCalibrationPoints' in obj && 'pointset' in obj &&
		isPoint(obj.liveCalibrationPoints.A) &&
		isPoint(obj.liveCalibrationPoints.B) &&
		isPoint(obj.liveCalibrationPoints.C) &&
		isPointset(obj.pointset);
}


const localStorageStorageKey = 'localSet';
/**
 * @class LocalSet
 * @description LocalSet is a class
 * that contains the local dataset that the client has
 * loaded from the server. It uses local storage to store
 * the data, and it is responsible for loading and saving
 * the data to the server.
 */
class LocalSet {

	getStorage(): LocalStorage {
		const localStorageItem = window.localStorage.getItem(localStorageStorageKey) ?? '{}';
		const parsed = JSON.parse(localStorageItem);
		if (!isLocalStorage(parsed)) {
			throw new Error('Invalid local storage');
		}
		return parsed;
	}

	setStorage(storage: LocalStorage) {
		window.localStorage.setItem(localStorageStorageKey, JSON.stringify(storage));
	}

	addPoint(point: Point) {
		const storage = this.getStorage();
		storage.pointset.points.push({
			data: point,
			number: storage.pointset.points.length,
			enabled: true
		});
		this.setStorage(storage);
	}

	disablePoint(pointNumber: number) {
		const storage = this.getStorage();
		const pointIndex = storage.pointset.points.findIndex((p) => p.number === pointNumber);
		storage.pointset.points[pointIndex].enabled = false;
		this.setStorage(storage);
	}

	getPoints(): Point[] {
		const storage = this.getStorage();
		return storage.pointset.points.map((p) => p.data);
	}
}