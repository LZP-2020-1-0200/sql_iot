import $ from 'jquery';
import type { PointData} from '../pointSet.js';

export let Psd: [[number, number], [number, number]] | null = null;
export let dataCals: {A: PointData; B: PointData; C: PointData} | null = null;
export let id = 0;

export let ptRadius: number;

export const afterInit: Array<() => void> = [];

export function init(setId: number, pts: {A: PointData; B: PointData; C: PointData}, ptR: number) {
	ptRadius = ptR;
	$('#selection').hide();
	id = setId;
	dataCals={
		A: {
			x: Number(pts.A.x),
			y: Number(pts.A.y),
			z: Number(pts.A.z),
		},
		B: {
			x: Number(pts.B.x),
			y: Number(pts.B.y),
			z: Number(pts.B.z),
		},
		C: {
			x: Number(pts.C.x),
			y: Number(pts.C.y),
			z: Number(pts.C.z),
		}
	};
	const A = dataCals.A;
	const B = dataCals.B;
	const C = dataCals.C;
	const b1: PointData = {x: B.x - A.x, y: B.y - A.y, z: 0};
	const b2: PointData = {x: C.x - A.x, y: C.y - A.y, z: 0};
	Psd = [
		[b1.x, b2.x],
		[b1.y, b2.y]
	];
}