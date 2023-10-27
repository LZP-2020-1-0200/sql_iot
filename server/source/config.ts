/// This file contains the configuration for the server.
/// It reads the config.toml file and parses it to a JSON object.
/// It also reads the environment variables and overwrites some of the config values,
/// if the environment variables are set.

import * as toml from 'toml';
import fs from 'fs';
import 'dotenv/config';


// read the toml config file.
export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));


export const server = {
	...config.server, 
	...process.env.STS_PORT && {port: Number(process.env.STS_PORT)}
} as {
	port: number;
};

config.database.password = process.env.STS_DB_PASS ?? config.database.password;
config.database.username = process.env.STS_DB_USER ?? config.database.username;
config.database.host = process.env.STS_DB_HOST ?? config.database.host;
config.database.name = process.env.STS_DB_NAME ?? config.database.name;

export const database = config.database as {
	name: string;
	username: string;
	password: string;
	host: string;
};

export const messageQueue = config.messageQueue as {
	monitorReloadTime: number;
};

export const heartbeatTimeout = Number(process.env.STS_HEARTBEAT_TIMEOUT ?? 60*1000);