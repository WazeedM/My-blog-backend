const mongoose = require('mongoose');

const replyCommentSchema = new mongoose.Schema({
    commentId: String,
    replyText: String,
    replyFrom: String,
    replyTo:String,
    replyPostedTime: Date,
    replyLikes:{
        type:Number,
        default:0
    },
    replyState: {
        type: Boolean,
        default:false
    },
    replyLikedBy:[String]
})
module.exports = mongoose.model('replyStore', replyCommentSchema);