const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const yearlyExpense = sequelize.define('yearlyExpenses', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    year:{
        type: Sequelize.STRING,
        allowNull: false
    },
    totalExpense:{
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = yearlyExpense;