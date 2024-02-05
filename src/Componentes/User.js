const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
});


const User = mongoose.model('User', userSchema);

module.exports = User;
