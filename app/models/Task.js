const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const Replica = require('./Replica');

class Task extends Model {}
Task.init({
  name: DataTypes.STRING,
  job_id: { type: DataTypes.STRING, defaultValue: null },
  assigned_to: { type: DataTypes.INTEGER, references: { model: Replica, key: 'id' } },
  duration: { type: DataTypes.INTEGER, validate: { min: 120 } },
  interval: { type: DataTypes.INTEGER, validate: { min: 0 } },
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending', 'unassigned'), defaultValue: 'unassigned' }
}, { sequelize, modelName: 'task' });

module.exports = Task;
