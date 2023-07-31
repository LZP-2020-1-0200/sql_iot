
export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

export const database = {
	name: "sts_db",
	username: "ST_server",
	password: "$*wY700O6^4$l2",
	host:"localhost"
};
export const messageQueue = {
	monitorReloadTime: 3000,
    
};