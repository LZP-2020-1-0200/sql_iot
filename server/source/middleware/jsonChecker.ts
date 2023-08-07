import type { NextFunction, Request, Response } from 'express';
import type { JSONValue } from '../config';

/**
 * A request with a json body
 */
export interface RequestJSON extends Request{
	json?: JSONValue | undefined;
}

/**
 * Middleware that checks if the request is a json request,
 * responding with a 400 if it is not
 */
export const jsonCheck = (req:RequestJSON, res: Response, next:NextFunction)=>{
	if(req.is('json')){
		req.json = req.body;
		next();
	}else{
		res.sendStatus(400);
	}
};
