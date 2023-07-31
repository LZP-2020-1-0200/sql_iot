import { Sequelize } from 'sequelize-typescript';
import { database as db } from '../config.js';
import { Sample } from './Sample.js';
import { Pointset } from './Pointset.js';
import { Experiment } from './Experiment.js';
import { Point } from './Point.js';
import { Measurement } from './Measurement.js';
export { Sample } from './Sample.js';
export { Pointset } from './Pointset.js';
export { Point } from './Point.js';
export { Experiment } from './Experiment.js';
export { Measurement } from './Measurement.js';

/**
 * The sequelize instance
 */
export const sequelize = new Sequelize(db.name, db.username, db.password, {
	host: db.host,
	dialect: 'mysql',
	models:[Sample, Pointset, Experiment, Point, Measurement]
});

/**
 * Tests the database connection
 * @returns true if the database connection is successful, false otherwise
 */
export const test = async ()=>{
	try {
		await sequelize.authenticate();
		console.log('Connection has been established successfully.');
		return true;
	} catch (error) {
		console.error('Unable to connect to the database:', error);
		return false;
	}
};

/**
 * Drops all tables. Very dangerous stuff
 */
export const clearDB=async ()=>{
	if(await test()){
		await sequelize.sync();
		await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
		await sequelize.drop();
		await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
		await sequelize.sync();
	}
};