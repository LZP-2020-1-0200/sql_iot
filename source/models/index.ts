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


/*import {
  Association, DataTypes, HasManyAddAssociationMixin, HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin, HasManyGetAssociationsMixin, HasManyHasAssociationMixin,
  HasManySetAssociationsMixin, HasManyAddAssociationsMixin, HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin, HasManyRemoveAssociationsMixin, Model, ModelDefined, Optional,
  Sequelize, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute, ForeignKey,
} from 'sequelize';
*/
export const sequelize = new Sequelize(db.name, db.username, db.password, {
	host: db.host,
	dialect: 'mysql',
	models:[Sample, Pointset, Experiment, Point, Measurement]
});

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




/*
export class Sample extends Model<InferAttributes<Sample>, InferCreationAttributes<Sample>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string>;

  // timestamps!
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;

  // Since TS cannot determine model association at compile time
  // we have to declare them here purely virtually
  // these will not exist until `Model.init` was called.
  declare getPointsets: HasManyGetAssociationsMixin<Pointset>; // Note the null assertions!
  declare addPointset: HasManyAddAssociationMixin<Pointset, number>;
  declare addPointsets: HasManyAddAssociationsMixin<Pointset, number>;
  declare setPointsets: HasManySetAssociationsMixin<Pointset, number>;
  declare removePointset: HasManyRemoveAssociationMixin<Pointset, number>;
  declare removePointsets: HasManyRemoveAssociationsMixin<Pointset, number>;
  declare hasPointset: HasManyHasAssociationMixin<Pointset, number>;
  declare hasPointsets: HasManyHasAssociationsMixin<Pointset, number>;
  declare countPointsets: HasManyCountAssociationsMixin;
  declare createPointset: HasManyCreateAssociationMixin<Pointset, 'sampleId'>;

};
Sample.init({
  // Model attributes are defined here
  id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
    // allowNull defaults to true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  paranoid: true,
  timestamps: true
});

export interface point{
  x:number;
  y:number;
  z:number;
}

export interface calibrationSet{
  A:point;
  B:point;
  C:point;
};

export class Pointset extends Model {};

Pointset.init({
  // Model attributes are defined here
  id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  calibrationPoints:{
    type: DataTypes.JSON
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
    // allowNull defaults to true
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  paranoid: true,
  timestamps: true
});

export class Point extends Model {};

Point.init({
  // Model attributes are defined here
  point_set_id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  pointNum:{
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  X: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Y: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Z: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  paranoid: true,
  timestamps: true
});

export class Experiment extends Model {};

Experiment.init({
  // Model attributes are defined here
  name:{
    type: DataTypes.STRING,
    allowNull: false
  },
  description:{
    type: DataTypes.TEXT
  },
  directory: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  details:{
    type: DataTypes.JSON
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  paranoid: true,
  timestamps: true
});

export class Measurement extends Model {};

Measurement.init({
  // Model attributes are defined here
  file_path:{
    type: DataTypes.STRING,
    allowNull: false
  },
  original_file_name:{
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type:{
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  paranoid: true,
  timestamps: true
});

Pointset.belongsTo(Sample, {
    foreignKey:{
        allowNull: false
    },
    onDelete: "RESTRICT"
});
Sample.hasMany(Pointset);

Point.belongsTo(Pointset, {
    foreignKey:{
        allowNull: false,
        name: "point_set_id"
    },
    onDelete: "RESTRICT"
});
Pointset.hasMany(Point, {
    foreignKey: {
        allowNull: false,
        name: "point_set_id"
    }
});

Experiment.belongsTo(Pointset,{
    foreignKey: {
        allowNull:false
    },
    onDelete: "RESTRICT"
});
Pointset.hasMany(Experiment);

Measurement.belongsTo(Experiment, {
    foreignKey: {
        allowNull:false
    },
    onDelete: "RESTRICT"
});
Experiment.hasMany(Measurement);

Measurement.belongsTo(Point, {
    foreignKey: {
        allowNull: false
    },
    onDelete: "RESTRICT"
});
Point.hasMany(Measurement);

*/
//sequelize.sync();

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