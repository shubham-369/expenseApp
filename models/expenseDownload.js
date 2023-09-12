const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ExpenseDownload = sequelize.define('expenseDownloads',{
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    url:{
        type: Sequelize.STRING(2048),
        allowNull: false
    }
});

module.exports = ExpenseDownload;