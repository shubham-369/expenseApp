const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId, 
        required: true, 
        ref: 'User'
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
