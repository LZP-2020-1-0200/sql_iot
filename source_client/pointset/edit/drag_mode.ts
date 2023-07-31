import $ from 'jquery';

/**
 * Enum for the different drag modes
 */
export const DRAG_MODE: Record<string, number> = {
	SELECT_MODE: 0,
	DRAW_MODE: 1
};


export let dragMode: number = DRAG_MODE.SELECT_MODE;

// Swap drag mode when the radio button is changed
$('input[name=dragmode]').on('change', () => {
	const val = $('input[name=dragmode]:checked').val();
	if (val !== undefined && typeof val === 'string') {
		const mode = DRAG_MODE[val];
		if (mode !== undefined && mode !== null && typeof mode === 'number') {
			dragMode = mode;
			console.log(dragMode);
		} else {
			alert("Something has gone wrong");
		}
	}else{
		alert("Something has gone wrong");
	}
});