const bcrypt = require('bcrypt');
const generateToken = require('../util/jwt');
const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const { username, email, password } = req.body;
    const saltRounds = 10;
    try {
        const existingUsername = await User.find({ username: username });
        const existingemail = await User.find({ email: email  });

        if (existingUsername.length > 0) {
            res.status(403).json({ message: 'Username already exists' });
        }else if(existingemail.length > 0){
            res.status(403).json({message: 'Email already exist'})
        } 
        else {
            bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
                if(err){
                    throw new err;
                }
                else{                            
                    const newUser = new User({
                        username: username,
                        email: email,
                        password: hashedPassword,
                        totalExpense: 0,
                        isPremiumUser: false
                    })
                    newUser.save()
                    .then(() => {
                        res.status(200).json({ message: 'User created' });
                    })
                    .catch((error) => {
                        console.log('error while creating user :', error);
                        res.status(500).json({message: 'Error while creating user'});
                    });                    
                }
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'Email does not exist' });
        }
        const result = await bcrypt.compare(password, user.password);

        if (result) {
            const token = generateToken(user);
            return res.status(200).json({ message: 'Log in successfully!', token});
        } 
        res.status(401).json({ message: 'Wrong password' });
    
    
    } catch (error) {
        console.error('Failed to login:', error);
        res.status(500).json({ message: 'Failed to login' });
    }
};


