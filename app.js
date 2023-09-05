const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./util/database');
require('dotenv').config();

const userRoutes = require('./routes/user');

const User = require('./models/user');
const Expense = require('./models/expenses');
const Order = require('./models/order');

app.use(express.json())
app.use(cors());
app.use(express.static('public'));
app.use(express.static('views'));

app.use('/user', userRoutes);

User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

const port = process.env.PORT || 1000;

sequelize
.sync()
.then(() => {
    app.listen(port);
})
.catch((error) => {
    console.log('server not starting : ', error);
});