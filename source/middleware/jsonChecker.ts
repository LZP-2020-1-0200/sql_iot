import type { NextFunction, Request, Response } from 'express';
import type { JSONValue } from '../config';


export interface RequestJSON extends Request{
	json?: JSONValue | undefined;
}

/**
 * Verifies that request is a json file
 */
export const jsonCheck = (req:RequestJSON, res: Response, next:NextFunction)=>{
	if(req.is('json')){
		req.json = req.body;
		next();
	}else{
		res.sendStatus(400);
	}
};
