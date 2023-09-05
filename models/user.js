const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const user = sequelize.define('users', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password:{
        type: Sequelize.STRING,
        allowNull: false
    },
    isPremiumUser:{
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

module.exports = user;