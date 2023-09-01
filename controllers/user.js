const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const existingUsername = await User.findAll({ where: { username: username} });
        const existingemail = await User.findAll({ where: { email: email } });

        if (existingUsername.length > 0) {
            res.status(403).json({ message: 'Username already exists' });
        }else if(existingemail.length > 0){
            res.status(403).json({message: 'Email already exist'})
        } 
        else {
            await User.create({
                username: username,
                email: email,
                password: password
            });
            res.status(200).json({ message: 'User created' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
}
