const { error } = require('console');
const User = require('../models/user');

exports.signup = (req, res, next) => {
    console.log(req.body);
    const {username, email, password} = req.body;
    User.create({
        username: username,
        email: email,
        password: password
    })
    .then(() => {
        res.status(200).json({message:'User created'});
    })
    .catch(error => {
        res.status(500).json({message: 'Failed to create user'});
    })
}