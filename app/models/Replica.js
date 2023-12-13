const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Replica extends Model {}
Replica.init({
  name: DataTypes.STRING,
}, { sequelize, modelName: 'replica' });

module.exports = Replica;
