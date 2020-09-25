/**
 * This file is used for storing Sentry logs when the server is shut down
 * When server is shut down, Sentry logs may not be delivered so saved logs will
 * guarantee logs are sent on next server's startup
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SentrySavedMessagesModel = mongoose.model('SentrySavedMessage', new Schema({
  tagString: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
}));

module.exports = {
  SentrySavedMessagesModel,
}
