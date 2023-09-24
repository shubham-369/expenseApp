const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET_KEY;
function generateToken(user){
    return jwt.sign(
        {
            userID: user.id,
            email: user.email
        },
        secretKey,
        {expiresIn: '3h'}
    );
}

module.exports = generateToken;