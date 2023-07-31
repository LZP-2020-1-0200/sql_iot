import type { Optional } from "sequelize";
import { AllowNull, AutoIncrement, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Experiment } from "./Experiment.js";
import { Point } from "./Point.js";

interface MeasurementAttributes{
	id:number;
	experimentId:number;
	pointNumber:number;
	filename:string;
}

export type MeasurementInput = Optional<MeasurementAttributes, 'id'>;
export type MeasurementOutput = Required<MeasurementAttributes>;

@Table({
	tableName: 'measurements'
})
export class Measurement extends Model<MeasurementAttributes, MeasurementInput>{

	@PrimaryKey
	@AutoIncrement
	@Column
	declare id: number;

	@ForeignKey(() => Experiment)
	@AllowNull(false)
	@Column
	declare experimentId: number;

	@BelongsTo(() => Experiment, 'experimentId')
	declare experiment: Experiment | undefined;

	@AllowNull(false)
	@Column
	declare pointNumber: number;

    
	public async point() : Promise<Point | null> {
		if(this.experiment === undefined || this.experiment === null){
			this.experiment = await this.$get('experiment') as Experiment;
		}
		if(this.experiment === null) return null;
		const point:Point | null = await Point.findOne({
			where:{
				pointNumber: this.pointNumber,
				pointsetId: this.experiment.pointsetId
			}
		});
		if(point === null)console.error("Referenced point not found");
		return point;
	}
}