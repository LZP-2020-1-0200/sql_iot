import $ from 'jquery';
import { id } from './edit/init.js';
import { generateCalibrationEvents, lastPoint, locationUpdateLoop, updateLocals } from './edit/loc_update.js';
import './edit/main.scss';
export { init } from './edit/init.js';
export { transformMatrix } from './edit/loc_update.js';
import './edit/select_mode.js';
import './edit/draw_mode.js';
import './edit/drag_mode.js';


// updates pointset data
$("#updateForm").on('submit', async (e) => {
	e.preventDefault();
	const body: Record<string, string> = {};
	// get the values from the form
	$("#updateForm :input[type=number]").each((i, elem) => {
		const inp = elem as HTMLInputElement;
		body[inp.name] = inp.value;
	});
	$("#updateForm :input[type=text]").each((i, elem) => {
		const inp = elem as HTMLInputElement;
		body[inp.name] = inp.value;
	});
	console.log(body);
	// send the new data to the server
	await fetch('', {
		method: 'PUT',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body)
	});
	location.reload();
	return false;
});


$('input[name=pointmode]').on('change', () => {
	const val = $('input[name=pointmode]:checked').val();
	if (val !== undefined && typeof val === 'string') {
		$('#singleDiv').hide();
		$('#lineDiv').hide();
		$('#rectangleDiv').hide();
		$(`#${val}Div`).show();
	}else{
		alert("Something has gone wrong");
	}
});

// disables text selection in svg
$('#txt text').on('mousedown', () => { return false; });

// Initialize the page
$(() => {
	generateCalibrationEvents();
	locationUpdateLoop();
	updateLocals();
});

// sends the new point to the server, then reloads the page
$('#addSingle').on('click', async () => {
	console.log(await fetch(`/pt/${id}/add`, {
		method: 'POST',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(lastPoint)
	}));
	location.reload();
});


