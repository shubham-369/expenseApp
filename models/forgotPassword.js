const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const forgotPasswordRequest = sequelize.define('forgotPasswordRequests', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
});

module.exports = forgotPasswordRequest;