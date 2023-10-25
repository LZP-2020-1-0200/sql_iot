import $ from 'jquery';


const experiment_starter_ws = new WebSocket(`ws://${location.host}/experiments/start/${$('#experimentId').data('experimentid')}`);

$('#startBtn').on('click', () => {
	experiment_starter_ws.send(JSON.stringify({type:'start'}));
});

experiment_starter_ws.onmessage = (msg) => {
	const data = JSON.parse(msg.data);
	console.log(data);
	if(data.type === 'error'){
		$('#experimentLog').prepend(`<p style="color:red">[${new Date(Date.now()).toLocaleString()}] ${data.data}</p>`);
	}
	if(data.type == 'info'){
		$('#experimentLog').prepend(`<p>[${new Date(Date.now()).toLocaleString()}] ${data.data}</p>`);
	}
};

experiment_starter_ws.onclose = () => {
	console.log('closed');
};

