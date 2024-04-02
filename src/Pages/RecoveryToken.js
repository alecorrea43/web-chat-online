// models/RecoveryToken.js
const mongoose = require('mongoose');

const recoveryTokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  expirationTime: Date,
});

const RecoveryToken = mongoose.model('RecoveryToken', recoveryTokenSchema);

module.exports = RecoveryToken;
