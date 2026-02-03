// middleware/adminAuth.js
const Admin = require('../models/admin');
const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = adminAuth;

// module.exports = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   try {
//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const admin = await Admin.findById(decoded.id);
//     if (!admin || admin.tokenVersion !== decoded.tokenVersion) {
//       return res.status(401).json({ message: 'Session expired' });
//     }

//     req.admin = admin;
//     next();
//   } catch {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };
