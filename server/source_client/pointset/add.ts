import { set_cal } from './pointSet.js';
import $ from 'jquery';

/**
 * Generates the event listeners for the calibration buttons
 * Relies on elements with ids of 'aBtn', 'bBtn', 'cBtn'
 * and elements with ids of
 * 
 * 'cax', 'cay', 'caz',
 * 
 * 'cbx', 'cby', 'cbz',
 * 
 * 'ccx', 'ccy', 'ccz'
 * 
 * to exist in the DOM
 */
function generateCalibrationEvents(){
	(['a', 'b', 'c'] as const).forEach((p) => {
		const btn: `${typeof p}Btn` = (`${p}Btn`);
		const btnElem=document.getElementById(btn);
		if(btnElem !== null){
			btnElem.onclick=(e) => {
				e.preventDefault();
				const cx = document.getElementById(`c${p}x`);
				const cy = document.getElementById(`c${p}y`);
				const cz = document.getElementById(`c${p}z`);
				if(cx !== null && cy !== null && cz !== null){
					if(cx instanceof HTMLInputElement && cy instanceof HTMLInputElement && cz instanceof HTMLInputElement){
						set_cal(cx, cy, cz, p );
					}
				}
			};
		}
	});
}

$(() => {
	generateCalibrationEvents();
});

