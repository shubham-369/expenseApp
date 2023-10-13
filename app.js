require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const userRoutes = require('./routes/user');
const premiumRoutes = require('./routes/premium');
const passwordRoutes = require('./routes/password');
const expenseRoutes = require('./routes/expense');


app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
    
app.use('/user', userRoutes);
app.use('/user', premiumRoutes);
app.use('/user', passwordRoutes);
app.use('/user', expenseRoutes);


const port = process.env.PORT || 3000;

mongoose
.connect(process.env.MONGOLINK)
.then(() => {
    app.listen(port);
    console.log('Connected!');
})
.catch((error) => {
    console.log('server not starting : ', error);
});
