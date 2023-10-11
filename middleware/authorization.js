const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
    const token = req.header("Authorization");
    if(!token){
        return res.status(401).json({message: 'Authentication failed: Tokken missing!'});
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.userID);
        if(!user){
            return res.status(401).json({message: 'Authentication Failed: User not exist!'});
        }
        req.user = user;
        next();
    }
    catch(error){
        console.log('error while authorization :', error);
        res.status(401).json({session: false, message: 'Authentication failed: Invalid token'})
    };
}

module.exports = authenticate;