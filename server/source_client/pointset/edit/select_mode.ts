import $ from 'jquery';
import { DRAG_MODE, dragMode } from "./drag_mode.js";
import * as mouse from './edit_select_events.js';
import { id } from "./init.js";

// list of selected items
let selected: number[] = [];

// clear selection when the selection rectangle is clicked
$('#selection').on('mousedown', () => {
	$('#selection').hide();
});

// sets rectangle start point and clears the previous rect
$('#ptCanvas').on('mousedown', () => {
	if(dragMode!==DRAG_MODE.SELECT_MODE) return;
	$('#selection').hide();
	$('#selection').attr('x', mouse.start.x);
	$('#selection').attr('y', mouse.start.y);
});

// resize rectangle appropriately on mouse moving
$('#ptCanvas').on('mousemove', () => {
	if(dragMode!==DRAG_MODE.SELECT_MODE) return;
	if(!mouse.dragging) return;
	$('#selection').show();
	const elem = $('#selection');
	const w = Math.abs(mouse.end.x - mouse.start.x);
	const h = Math.abs(mouse.end.y - mouse.start.y);
	elem.attr('x', Math.min(mouse.start.x, mouse.end.x));
	elem.attr('y', Math.min(mouse.start.y, mouse.end.y));
	elem.attr('width', w);
	elem.attr('height', h);
});

// find all points in rectangle
$('#ptCanvas').on('mouseup', () => {
	$('#selection').hide();
	if(dragMode!==DRAG_MODE.SELECT_MODE) return;
	// clear selection
	selected.forEach(elem => {
		$(`g[number=${elem}]`).removeClass('selectedPt');
	});
	selected = [];
	//calculate which points are inside rect
	const minx = Math.min(mouse.start.x, mouse.end.x);
	const miny = Math.min(mouse.start.y, mouse.end.y);
	const maxx = Math.max(mouse.start.x, mouse.end.x);
	const maxy = Math.max(mouse.start.y, mouse.end.y);
	$('g.point circle').each((i, elem) => {
		const x = Number(elem.getAttribute('cx'));
		const y = Number(elem.getAttribute('cy'));
		if(!isNaN(x) && !isNaN(y)) {
			if(minx < x && x < maxx && miny < y && y< maxy) {
				selected.push(Number(elem.getAttribute('number')));
				if(elem.parentElement) elem.parentElement.classList.add('selectedPt');
			}
		}
	});
});

// individual select
$('g').on('click', (e) => {
	e.preventDefault();
	const numAttr = e.target.getAttribute('number');
	if(numAttr !== null){
		const num = Number(numAttr);
		if(!isNaN(num)){
			selected.forEach(elem => {
				$(`g[number=${elem}]`).removeClass('selectedPt');
			});
			selected = [num];
			$(`g[number=${num}]`).addClass('selectedPt');
		}
	}
	console.log(selected);
});

// send request to disable selected points
$('#disableButton').on('click', async () => {
	console.log(await fetch(`/pt/${id}/edit`, {
		method: 'PUT',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ pointNumber: selected, enabled: false })
	}));
	location.reload();
});

// send request to enable selected points
$('#enableButton').on('click', async () => {
	console.log(await fetch(`/pt/${id}/edit`, {
		method: 'PUT',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ pointNumber: selected, enabled: true })
	}));
	location.reload();
});

