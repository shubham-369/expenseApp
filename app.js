require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./util/database');
const helmet = require('helmet');
const path = require('path');

const userRoutes = require('./routes/user');
const premiumRoutes = require('./routes/premium');
const passwordRoutes = require('./routes/password');
const expenseRoutes = require('./routes/expense');

const User = require('./models/user');
const Expense = require('./models/expenses');
const Order = require('./models/order');
const forgotPasword = require('./models/forgotPassword');
const ExpenseDownload = require('./models/expenseDownload');
const TotalYearExpense = require('./models/totalYearExpense');

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
    
app.use('/user', userRoutes);
app.use('/user', premiumRoutes);
app.use('/user', passwordRoutes);
app.use('/user', expenseRoutes);

User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(forgotPasword);
forgotPasword.belongsTo(User);

User.hasMany(ExpenseDownload);
ExpenseDownload.belongsTo(User);

User.hasMany(TotalYearExpense);
TotalYearExpense.belongsTo(User);

const port = process.env.PORT || 3000;

sequelize
.sync()
.then(() => {
    app.listen(port);
})
.catch((error) => {
    console.log('server not starting : ', error);
});