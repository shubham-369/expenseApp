const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define( 'Orders', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    paymentID:{
        type: Sequelize.STRING,
        allowNull: true
    }, 
    orderID:{
        type: Sequelize.STRING,
        allowNull: false
    },
    status:{
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Order;