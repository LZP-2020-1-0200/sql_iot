import { Table, Column, HasMany, BelongsTo, Model, PrimaryKey, AutoIncrement, AllowNull, DataType, ForeignKey} from 'sequelize-typescript';
import { Sample } from './Sample.js';
import type { Optional } from 'sequelize';
import { Point } from './Point.js';
import { Experiment } from './Experiment.js';
import { calibrationSet } from '../lib/coordinate.js';



interface PointsetAttributes{
	id:number;
	name:string;
	description:string;
	calibration:calibrationSet;
	sampleId:number;
}

export type PointsetInput = Optional<PointsetAttributes, 'id'|'description'>;
export type PointsetOutput = Required<PointsetAttributes>;


@Table({
	tableName:'pointsets'
})
export class Pointset extends Model<PointsetAttributes, PointsetInput> {

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
	@Column(DataType.JSON)
	declare calibration: calibrationSet;

	@ForeignKey(() => Sample)
	@AllowNull(false)
	@Column
	declare sampleId: number;

	@BelongsTo(() => Sample, 'sampleId')
	declare sample: Sample | undefined;

	@HasMany(() => Point, 'pointsetId')
	declare points: Point[] | undefined;

	@HasMany(() => Experiment, 'pointsetId')
	declare experiments: Experiment[] | undefined;

	async edit(
		name: string, 
		description: string, 
		calibration: calibrationSet) {
		this.name = name;
		this.description = description;
		this.calibration = calibration;
		await this.save();
	}
}


