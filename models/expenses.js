const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Expense = sequelize.define('expenses',{
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    price:{
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    },
    description:{
        type: Sequelize.STRING,
        allowNull: false
    },
    category:{
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Expense;