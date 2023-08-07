/**
 * Contains drawing mode functions and event listeners
 * to make drawing lines be functional
 */

import $ from 'jquery';
import { DRAG_MODE, dragMode } from './drag_mode.js';
import * as mouse from './edit_select_events.js';
import { dot, len, unit, type PointData } from '../pointSet.js';
import { id, ptRadius } from './init.js';
import { lastPoint } from './loc_update.js';
import { POINT_MODE, pointMode } from './point_mode.js';

/**
 * The start point of the line
 */
let start: PointData = {x: 0, y: 0, z: 0};

/**
 * The end point of the line
 */
let end: PointData = {x: 0, y: 0, z: 0};

/**
 * The number of points to generate along the line
 */
let pointCount = 2;

/**
 * The points that have been queued to be sent to the server
 */
let queuedPoints: PointData[] = [];

function renderQueuedPoints(){
	// First make a circle for each point
	// If there's more svg circles than points, remove the extra
	// If there's more points than svg circles, add more
	if(queuedPoints.length < $('#previewCircles').children().length){
		$('#previewCircles').children().slice(queuedPoints.length).remove();
	}else if(queuedPoints.length > $('#previewCircles').children().length){
		const circles = [];
		const delta = queuedPoints.length - $('#previewCircles').children().length;
		for(let i = 0; i < delta; i++){
			const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
			circles.push(circle);
		}
		$('#previewCircles').append(...circles);
		$('#previewCircles').children().attr('r', ptRadius/2);
	}
	// Then set the position of each circle
	$('#previewCircles').children().each((i, e) => {
		const pt = queuedPoints[i];
		if(!isNaN(pt.x) && !isNaN(pt.y)) {
			e.setAttribute('cx', pt.x.toString());
			e.setAttribute('cy', pt.y.toString());
		}
	});
}

/**
 * Assuming that a and b are one of the edges of the rectangle,
 * find the third corner of the rectangle
 * assuming c is on the same line as the opposite edge
 * @param a 
 * @param b 
 * @param c 
 */
function findThirdCorner(a: PointData, b: PointData, c: PointData): PointData{
	// project c onto the line from a to b
	const vectorAB: PointData = {
		x: b.x - a.x,
		y: b.y - a.y,
		z: b.z - a.z
	};
	const vectorAC: PointData = {
		x: c.x - a.x,
		y: c.y - a.y,
		z: c.z - a.z
	};
	// dot = |vectorAB| * |vectorAC| * cos(angle) =
	// = |vectorAB| * projectionLength
	const dotProd = dot(vectorAB, vectorAC);
	const ABlen = len(vectorAB);
	// scalar = dot / |vectorAB| = projectionLength
	const scalar = dotProd/ABlen;
	const ABUnit = unit(vectorAB);

	
	const projection: PointData = {
		x: ABUnit.x * scalar,
		y: ABUnit.y * scalar,
		z: ABUnit.z * scalar
	};
	// find the 3rd corner
	const corner3Vec: PointData = {
		x: vectorAC.x - projection.x,
		y: vectorAC.y - projection.y,
		z: vectorAC.z - projection.z,
	};
	const corner3: PointData = {
		x: a.x + corner3Vec.x,
		y: a.y + corner3Vec.y,
		z: a.z + corner3Vec.z
	};
	return corner3;
}

/**
 * Redraws the circles in the preview
 */
function redrawCircles(){
	if(pointMode === POINT_MODE.LINE) {
		// Get the iteration step between the start and end points
		const delta: PointData = {
			x: (end.x - start.x)/(pointCount-1),
			y: (end.y - start.y)/(pointCount-1),
			z: (end.z - start.z)/(pointCount-1)
		};

		queuedPoints = [];
		// Draw the circles
		for(let d = 0; d < pointCount; d++){
			const point: PointData = {
				x: start.x + delta.x * d,
				y: start.y + delta.y * d,
				z: start.z + delta.z * d
			};
			queuedPoints.push(point);
		}
		renderQueuedPoints();
	}else if(pointMode === POINT_MODE.RECTANGLE){
		
		// Get the third corner of the rectangle
		const corner3 = findThirdCorner(start, end, lastPoint);
		// Get the iteration step between the start and end points
		const pointCountX = Number($('#rectWidthPointCount').val());
		const pointCountY = Number($('#rectLengthPointCount').val());
		const deltaX: PointData = {
			x: (end.x - start.x)/(pointCountX-1),
			y: (end.y - start.y)/(pointCountX-1),
			z: (end.z - start.z)/(pointCountX-1)
		};
		const deltaY: PointData = {
			x: (corner3.x - start.x)/(pointCountY-1),
			y: (corner3.y - start.y)/(pointCountY-1),
			z: (corner3.z - start.z)/(pointCountY-1)
		};
		queuedPoints = [];
		// Draw the circles
		for(let x = 0; x < pointCountX; x++){
			for(let y = 0; y < pointCountY; y++){
				const point: PointData = {
					x: start.x + deltaX.x * x + deltaY.x * y,
					y: start.y + deltaX.y * x + deltaY.y * y,
					z: start.z + deltaX.z * x + deltaY.z * y
				};
				queuedPoints.push(point);
			}
		}
		
		renderQueuedPoints();
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

// set the default number of points
$('#lineCount').val(2);

/**
 * When the number of points is changed,
 * check if it is valid and
 * update the preview
 */
$('#lineCount').on('change', () => {
	const c = Number($('#lineCount').val());
	if(isNaN(c) || c<2){
		$('#lineCount').val(pointCount);
	}
	pointCount = c;
	redrawCircles();
});

// set the default number of points
$('#rectLengthPointCount').val(2);
$('#rectWidthPointCount').val(2);

/**
 * When the number of points is changed,
 * check if it is valid and
 * update the preview
 */
$('#rectLengthPointCount').on('change', () => {
	const c = Number($('#rectLengthPointCount').val());
	if(isNaN(c) || c<2){
		$('#rectLengthPointCount').val(pointCount);
	}
	pointCount = c;
	redrawCircles();
});
$('#rectWidthPointCount').on('change', () => {
	const c = Number($('#rectWidthPointCount').val());
	if(isNaN(c) || c<2){
		$('#rectWidthPointCount').val(pointCount);
	}
	pointCount = c;
	redrawCircles();
});

/**
 * manually set the start point
 */
$('#lineStartBtn').on('click', () => {
	start = lastPoint;
	$('#drawieLine').attr('x1', start.x);
	$('#drawieLine').attr('y1', start.y);
	redrawCircles();
});

/**
 * manually set the end point
 */
$('#lineEndBtn').on('click', () => {
	end = lastPoint;
	$('#drawieLine').attr('x2', end.x);
	$('#drawieLine').attr('y2', end.y);
	redrawCircles();
});

/**
 * Send the generated points to the server
 * and reload the page to show the new points
 * in the pointset
 */
// WONTFIX: make this not reload the page (would require a lot of refactoring and add extra points of failure)

$('#lineCreateBtn, #rectangleCreateBtn').on('click', async () => {
	await fetch(`/pt/${id}/bulkadd`, {
		method: 'POST',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(queuedPoints)
	});
	location.reload();
});