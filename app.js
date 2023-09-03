const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./util/database');

const userRoutes = require('./routes/user');

const User = require('./models/user');
const Expense = require('./models/expenses');
const ExpenseItem = require('./models/expenseItem');

app.use(express.json())
app.use(cors());
app.use(express.static('public'));
app.use(express.static('views'));

app.use('/user', userRoutes);

User.belongsToMany(Expense, { through: ExpenseItem });
Expense.belongsToMany(User, { through: ExpenseItem });

const port = process.env.PORT || 1000;

sequelize
.sync()
.then(() => {
    app.listen(port);
})
.catch((error) => {
    console.log('server not starting : ', error);
});