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

app.use(express.json())
app.use(cors());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdnjs.cloudflare.com', 'code.jquery.com', 'cdn.jsdelivr.net', 'checkout.razorpay.com'],            
            frameSrc: ["'self'", 'https://api.razorpay.com'],
        },
    })
);
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', userRoutes);
app.use('/user', premiumRoutes);
app.use('/user', passwordRoutes);
app.use('/user', expenseRoutes);
app.use((req, res) => {
    res.sendFile(path.join(__dirname, `public/${req.url}`));
});

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