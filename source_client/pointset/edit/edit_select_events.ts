import $ from 'jquery';

export let dragging = false;
export let start = { x: 0, y: 0 };
export let end = { x: 0, y: 0};
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
		// console.log(x,y);
	}
});

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

$('#ptCanvas').on('mouseup', () => {
	dragging=false;
});
