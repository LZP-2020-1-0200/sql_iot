import * as toml from 'toml';
import fs from 'fs';

export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));


export const server = config.server as {
	port: number;
};

config.database.password = fs.readFileSync(config.database.passwordFile, 'utf-8');

export const database = config.database as {
	name: string;
	username: string;
	password: string;
	host: string;
};

export const messageQueue = config.messageQueue as {
	monitorReloadTime: number;
};