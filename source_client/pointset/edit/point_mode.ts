import $ from 'jquery';

export enum POINT_MODE {
	SINGLE = 0,
	LINE = 1,
	RECTANGLE = 2
}

export let pointMode: POINT_MODE = POINT_MODE.SINGLE;

$('input[name=pointmode]').on('change', () => {
	const val = $('input[name=pointmode]:checked').val();
	if (val !== undefined && typeof val === 'string') {
		$('#singleDiv').hide();
		$('#lineDiv').hide();
		$('#rectangleDiv').hide();
		$(`#${val}Div`).show();
		if(val === "single"){
			pointMode = POINT_MODE.SINGLE;
		}else if(val === "line"){
			pointMode = POINT_MODE.LINE;
		}else if(val === "rectangle"){
			pointMode = POINT_MODE.RECTANGLE;
		}
	}else{
		console.error("Something has gone wrong");
	}
});