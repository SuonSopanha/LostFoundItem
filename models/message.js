const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  account1: {
    accountID: String,
    username: String
  },
  account2: {
    accountID: String,
    username: String
  },
  messageContent: [
    {
      text: String,
      date: String,
      accountID: String
    }
  ]
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;