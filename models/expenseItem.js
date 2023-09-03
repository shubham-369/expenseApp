const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ExpenseItem = sequelize.define('expenseItems',{
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }
});

module.exports = ExpenseItem;