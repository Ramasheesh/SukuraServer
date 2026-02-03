// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    // required: true
  },

  // This is BOTH password + API key
  secretKey: {
    type: String,
    required: true
  },

  tokenVersion: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

/* hash key */
adminSchema.pre('save', async function (next) {
  if (this.isModified('secretKey')) {
    this.secretKey = await bcrypt.hash(this.secretKey, 10);
    // console.log('this.secretKey: ', this.secretKey);
  }
  // next();
});

module.exports = mongoose.model('admin', adminSchema);
