const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const secret = global.APP_CONFIG.restaurantPlusApiJwtSecrect;

const jwtValidator = expressJwt({
  secret: secret,
  algorithms: ['HS256'],
  requestProperty: 'auth',
});

function generateUserJwtToken(data, expiresIn) {
  return jwt.sign(data, secret, {expiresIn});
}

/*function authMiddleware(req, res, next) {
  const authHeader = req.header('Authorization'); //TODO: authHeader can be null
  const token = authHeader.replace('Bearer ', '');

  try {
    const {userId, exp} = jwt.verify(token, secret);

    const expiryDate = new Date(exp);
    if (expiryDate < new Date()) throw new Error('Token is expired');

    next();
  } catch (e) {
    respondWithError(res, 401, 'Authentication required');
  }
}*/

// console.log(generateUserJwtToken({userId: 'abc'}, '1d'));
// console.log(generateUserJwtToken({userId: 'abc'}, '1d'));
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMiLCJpYXQiOjE1OTczMTU2NTEsImV4cCI6MTU5NzQwMjA1MX0.fhpLZShVNnzdeO1xg6nmW08XFBkm2C6G8TPl0gOio-Y


module.exports = {
  generateUserJwtToken, jwtValidator,
}