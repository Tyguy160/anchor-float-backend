const jwt = require('jsonwebtoken');

function populateUser(req) {
  const token = req.cookies.token || null;
  if (token) {
    try {
      const user = jwt.verify(token, process.env.APP_SECRET);
      return user;
    } catch (err) {
      return null;
    }
  }
  return null;
}

function getUserTokenFromId(userId) {
  const EXPIRES_IN = '30d';
  return jwt.sign({ userId }, process.env.APP_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

module.exports = { populateUser, getUserTokenFromId };
