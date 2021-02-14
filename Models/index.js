const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
  host: process.env.HOST,
  dialect: process.env.DIALECT
});

const db = {};

db.Sequelize = Sequelize;
db.sequelizeConfig = sequelize

db.register = require('./registerSchema')(sequelize, Sequelize);
module.exports = db;