const { Sequelize, OptimisticLockError } = require('sequelize');

const { POSTGRES_PORT, POSTGRES_DATABASE, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_HOST } = process.env;

const sequelize = new Sequelize(POSTGRES_DATABASE, POSTGRES_USERNAME, POSTGRES_PASSWORD, {
  host: POSTGRES_HOST,
  dialect: 'postgres'
});

module.exports = { sequelize, OptimisticLockError };