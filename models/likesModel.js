const mongoose = require('mongoose');

const likesSchema = new mongoose.Schema({
    blogId: String,
    likeCount:Number,
    likeStatus:Boolean,
    username:String,
    users:[String]
})
module.exports = mongoose.model('likesStore', likesSchema);