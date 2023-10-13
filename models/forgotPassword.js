const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const FPRSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    isActive: {
        type: Boolean,
        default: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('FPRequest', FPRSchema);