const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    blogId: String,
    userComment: String,
    username:String,
    commentPostedTime: Date,
    commentLikes:{
        type:Number,
        default:0
    },
    likeState: {
        type: Boolean,
        default:false
    },
    commentLikedBy:[String],
    repliedBy:[String],
    replyToggleStatus:{
        type:Boolean,
        default:false
    }
})
module.exports = mongoose.model('commentStore', commentSchema);