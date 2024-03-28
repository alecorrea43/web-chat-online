const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
 sender: { type: String, required: true },
 recipient: { type: String, required: true },
 text: { type: String, required: true },
 createdAt: { type: Date, default: Date.now },
 conversationId: { type: String, required: true }, // Nuevo campo para identificar la conversación

});

module.exports = mongoose.model('Message', messageSchema);