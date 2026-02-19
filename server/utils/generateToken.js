// utils/generateToken.js
const jwt = require('jsonwebtoken');

module.exports = (admin) =>
  jwt.sign(
    {
      id: admin._id,
      tokenVersion: admin.tokenVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );