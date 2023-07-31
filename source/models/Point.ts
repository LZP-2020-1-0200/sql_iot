import { Table, Column, BelongsTo, Model, PrimaryKey, AllowNull, ForeignKey, Default} from 'sequelize-typescript';
import type { Optional } from 'sequelize';
import type { PointData } from '../lib/coordinate.js';
import { Pointset } from './Pointset.js';


interface PointAttributes extends PointData{
	pointNumber: number;
	pointsetId: number;
}

export type PointInput = Optional<PointAttributes, never>;
export type PointOutput =Required<PointAttributes>;

@Table({
	tableName:'points'
})
export class Point extends Model<PointAttributes, PointInput> {

	@PrimaryKey
	@Column
	declare pointNumber: number;

	@PrimaryKey
	@ForeignKey(()=>Pointset)
	@Column
	declare pointsetId: number;

	@AllowNull(false)
	@Column
	declare x: number;
    
	@AllowNull(false)
	@Column
	declare y: number;

	@AllowNull(false)
	@Column
	declare z: number;

	@AllowNull(false)
	@Default(true)
	@Column
	declare enabled: boolean;

	@BelongsTo(()=>Pointset, 'pointsetId')
	declare pointsets: Pointset[] | undefined;

}