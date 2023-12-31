import type { Optional } from "sequelize";
import { Model, AllowNull, AutoIncrement, BelongsTo, Column, DataType, ForeignKey, PrimaryKey, Table, Default } from "sequelize-typescript";
import { Pointset } from "./Pointset.js";
import { JSONValue } from "../config.js";



/**
 * The attributes of an experiment
 */
export interface ExperimentAttributes{
	id: number;
	name: string;
	description: string;
	data:JSONValue;
	pointsetId: number;
}

export type ExperimentInput = Optional<ExperimentAttributes, 'id' | 'description' | 'data'>;
export type ExperimentOutput = Required<ExperimentAttributes>;

@Table({
	tableName: 'experiments'
})
export class Experiment extends Model<ExperimentAttributes, ExperimentInput>{

	@PrimaryKey
	@AutoIncrement
	@Column
	declare id: number;

	@AllowNull(false)
	@Column
	declare name: string;

	@Column
	declare description: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare started: boolean;

	@Column(DataType.JSON)
	declare data:JSONValue;

	@ForeignKey(()=>Pointset)
	@AllowNull(false)
	@Column
	declare pointsetId: number;

	@BelongsTo(()=>Pointset, 'pointsetId')
	declare pointset: Pointset | undefined;
}