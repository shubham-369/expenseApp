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
};

exports.login = async(req, res, next) => {
    const {username, password} = req.body;

    try{
        const user = await User.findOne({where:{username: username}});
        if(!user){
            res.status(404).json({message: 'Username does not exist'});
        }else if(user.password !== password){
            res.status(401).json({message: 'Wrong password'});
        }else{
            res.status(200).json({message: 'Log in successfully!'});
        }
    }
    catch(error) {
        console.log('failed to login :', error);
        res.status(500).json({message: 'failed to login'});
    }

};