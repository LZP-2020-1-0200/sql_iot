import { Table, Column, HasMany, Model, PrimaryKey, AutoIncrement, AllowNull} from 'sequelize-typescript';
import { Pointset } from './Pointset.js';
import type { Optional } from 'sequelize';


export interface SampleAttributes{
	id:number;
	name:string;
	description:string;
}

export type SampleInput = Optional<SampleAttributes, 'id' | 'description'>;
export type SampleOutput = Required<SampleAttributes>;


@Table({
	tableName:'samples'
})
export class Sample extends Model<SampleAttributes, SampleInput> {

	@PrimaryKey
	@AutoIncrement
	@Column
	declare id: number;

	@AllowNull(false)
	@Column
	declare name: string;

	@Column
	declare description: string;

	@HasMany(() => Pointset, 'sampleId')
	declare pointsets: Pointset[] | undefined;
}

