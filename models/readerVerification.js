const mongoose = require('mongoose');

const readerVerificationSchema = new mongoose.Schema({
    readerId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date
})
module.exports = mongoose.model('readerVerificationModel', readerVerificationSchema);