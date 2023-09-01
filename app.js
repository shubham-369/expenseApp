const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./util/database');
const exp = require('constants');

const userRoutes = require('./routes/user');

app.use(express.json())
app.use(cors());
app.use(express.static('public'));
app.use(express.static('views'));

app.use('/user', userRoutes);

const port = process.env.PORT || 1000;

sequelize
.sync()
.then(() => {
    app.listen(port);
})
.catch((error) => {
    console.log('server not starting : ', error);
});