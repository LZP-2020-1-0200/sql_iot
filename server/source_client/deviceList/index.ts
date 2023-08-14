import $ from 'jquery';

const loadingSpinner = 
	`
	<div class="spinner-border text-primary" role="status">
	</div>
	`;

const refreshTable = async () => {
	$('#deviceBtn').prop('disabled', true);
	$('#deviceTable').html(loadingSpinner);
	const response = await fetch('/messageQueue/deviceTable');
	const html = await response.text();
	$('#deviceTable').html(html);
	$('#deviceBtn').prop('disabled', false);
	console.log(html);
}
$('#deviceBtn').on('click', refreshTable);
$(() => refreshTable());
