const Sequelize = require('sequelize');
const sequelize = new Sequelize('expenseapp', 'root', 'r333@666m999', {
    dialect: 'mysql',
    host: 'localhost'
})

module.exports = sequelize;