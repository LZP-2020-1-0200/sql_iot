import $ from 'jquery';
import { DRAG_MODE, dragMode } from './drag_mode.js';
import * as mouse from './edit_select_events.js';
import type { PointData } from '../pointSet.js';
import { id, ptRadius } from './init.js';
import { lastPoint } from './loc_update.js';

let start: PointData = {x: 0, y: 0, z: 0};
let end: PointData = {x: 0, y: 0, z: 0};

let pointCount: number;

function redrawCircles(){
	const previewGroup = $<SVGGElement>('#previewCircles');
	previewGroup.empty();
	const delta: PointData = {
		x: (end.x - start.x)/(pointCount-1),
		y: (end.y - start.y)/(pointCount-1),
		z: (end.z - start.z)/(pointCount-1)
	};
	for(let d = 0; d < pointCount; d++){
		const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
		const circlesvg = $<SVGCircleElement>(circle);
		circlesvg.attr('r', ptRadius/2);
		circlesvg.attr('cx', start.x+delta.x*d);
		circlesvg.attr('cy', start.y+delta.y*d);
		previewGroup.append(circlesvg);
	}
	
}

// clear selection when the selection rectangle is clicked
$('#selection').on('mousedown', () => {
	$('#selection').hide();
});

// sets rectangle start point and clears the previous rect
$('#ptCanvas').on('mousedown', () => {
	if(dragMode!==DRAG_MODE.DRAW_MODE) return;
	$('#drawieLine').attr('x1', mouse.start.x);
	$('#drawieLine').attr('y1', mouse.start.y);
	$('#drawieLine').attr('x2', mouse.start.x);
	$('#drawieLine').attr('y2', mouse.start.y);
	start = {...start, ...mouse.start};
	end = {...end, ...mouse.start};
	redrawCircles();
});

// resize rectangle appropriately on mouse moving
$('#ptCanvas').on('mousemove', () => {
	if(dragMode!==DRAG_MODE.DRAW_MODE) return;
	if(!mouse.dragging) return;
	$('#drawieLine').attr('x2', mouse.end.x);
	$('#drawieLine').attr('y2', mouse.end.y);
	end = {...end, ...mouse.end};
	redrawCircles();
});

// find all points in rectangle
$('#ptCanvas').on('mouseup', () => {
	if(dragMode!==DRAG_MODE.DRAW_MODE) return;
	redrawCircles();
});

$('#lineCount').val(2);

$('#lineCount').on('change', () => {
	const c = Number($('#lineCount').val());
	if(isNaN(c) || c<2){
		$('#lineCount').val(pointCount);
	}
	pointCount = c;
	redrawCircles();
});

$('#lineStartBtn').on('click', () => {
	start = lastPoint;
	$('#drawieLine').attr('x1', start.x);
	$('#drawieLine').attr('y1', start.y);
	redrawCircles();
});

$('#lineEndBtn').on('click', () => {
	end = lastPoint;
	$('#drawieLine').attr('x2', end.x);
	$('#drawieLine').attr('y2', end.y);
	redrawCircles();
});

$('#lineCreateBtn').on('click', async () => {
	const delta: PointData = {
		x: (end.x - start.x)/(pointCount-1),
		y: (end.y - start.y)/(pointCount-1),
		z: (end.z - start.z)/(pointCount-1)
	};
	for(let d = 0; d < pointCount; d++){
		const pt: PointData = {
			x: start.x + delta.x * d,
			y: start.y + delta.y * d,
			z: start.z + delta.z * d
		};
		await fetch(`/pt/${id}/add`, {
			method: 'POST',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(pt)
		});
	}
	location.reload();
});