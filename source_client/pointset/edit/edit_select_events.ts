import $ from 'jquery';

/**
 * Contains the current state of the mouse
 */
export let dragging = false;

/**
 * The start point of drag
 */
export let start = { x: 0, y: 0 };

/**
 * The end point of drag
 */
export let end = { x: 0, y: 0};

/* 
 * clear start and end points when starting a new drag
 * and set dragging to true
 */
$('#ptCanvas').on('mousedown', (e) => {
	const svg = $('#ptCanvas')[0] as HTMLElement & SVGElement;
	const rect = (svg as SVGElement).getBoundingClientRect();
	const viewbox = svg.getAttribute('viewBox');
	if(viewbox !== null) {
		const ps = viewbox.split(' ');
		const params: number[]=[];
		ps.forEach(p => { params.push(Number(p)); });
		// console.log(params);
		const x = params[0] + (params[2])*e.offsetX/(rect.width);
		const y = params[1] + (params[3])*e.offsetY/(rect.height);
		start = { x, y };
		end = { x, y };
		dragging=true;
	}
});

// update the end point when the mouse moves while dragging
$('#ptCanvas').on('mousemove', (e) => {
	if(!dragging) return;
	const svg = $('#ptCanvas')[0] as HTMLElement & SVGElement;
	const rect = (svg as SVGElement).getBoundingClientRect();
	const viewbox = svg.getAttribute('viewBox');
	if(viewbox !== null) {
		const ps = viewbox.split(' ');
		const params: number[]=[];
		ps.forEach(p => { params.push(Number(p)); });
		// console.log(params);
		const x = params[0] + (params[2])*e.offsetX/(rect.width);
		const y = params[1] + (params[3])*e.offsetY/(rect.height);
		end = { x, y };
	}
});

// clear dragging when the mouse is released to not update the end point
$('#ptCanvas').on('mouseup', () => {
	dragging=false;
});
