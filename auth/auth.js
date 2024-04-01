//auth.js

const jwt = require('jsonwebtoken');
const tok='myToken'
const authenticateTokenHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        jwt.verify(authHeader, tok, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
             next();
        });
    } else {
        res.sendStatus(401);
    }
}
const generateToken = (user) => {
    return jwt.sign(user, tok, { expiresIn: '1h' });
};
module.exports={
    generateToken,
    authenticateTokenHandler
}