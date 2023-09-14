const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./util/database');
const helmet = require('helmet');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

const userRoutes = require('./routes/user');
const premiumRoutes = require('./routes/premium');
const passwordRoutes = require('./routes/password');
const expenseRoutes = require('./routes/expense');

const User = require('./models/user');
const Expense = require('./models/expenses');
const Order = require('./models/order');
const forgotPasword = require('./models/forgotPassword');
const ExpenseDownload = require('./models/expenseDownload');

const accessLogStream = fs.createWriteStream('./access.log', {flags: 'a'});

app.use(express.json())
app.use(cors());
app.use(helmet());
app.use(express.urlencoded({extended: true}));

app.use(morgan('combined', {stream: accessLogStream}));

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

const port = process.env.PORT || 1000;

sequelize
.sync()
.then(() => {
    app.listen(port);
})
.catch((error) => {
    console.log('server not starting : ', error);
});