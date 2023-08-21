import $ from 'jquery';
import io from 'socket.io-client';

const socket = io();
socket.on('connect', () => {
	console.log('connected');
});
socket.on('disconnect', () => {
	console.log('disconnected');
});
$('#startBtn').on('click', () => {
	console.log('start');
	socket.emit('message', 'start');
});	