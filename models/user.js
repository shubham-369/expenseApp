const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    totalExpense: {
        type: Number,
        required: true,
    },
    isPremiumUser: {
        type: Boolean,
        required: true,
    }
});

module.exports = mongoose.model('User', userSchema);
