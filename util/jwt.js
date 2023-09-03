const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = process.env.JWT_SECRET_KEY || crypto.randomBytes(32).toString('hex');
function generateToken(user){
    return jwt.sign(
        {
            userID: user.id,
            email: user.email
        },
        secretKey,
        {expiresIn: '1h'}
    );
}

module.exports = generateToken;