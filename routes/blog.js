const express = require('express');
const router = express.Router();
const likesStore = require('../models/likesModel');
const commentStore = require('../models/commentsModel');
const replyStore = require('../models/replyCommentModel');

router.post('/:blogId', async (req,res)=>{
    try{
        let {blogId, likeCount, likeStatus, users, username} = req.body;
        let likeData = req.body;
        
        await likesStore.findOne({blogId:blogId}).then( async blog=>{
            if(blog){
                if(!likeStatus){
                    await likesStore.updateOne({blogId:blogId}, 
                        {$set:{likeCount:likeCount,likeStatus:likeStatus},
                        $pull:{users:username}})
                }
                else{
                    await likesStore.updateOne({blogId:blogId}, 
                        {$set:{likeCount:likeCount,likeStatus:likeStatus},
                        $push:{users:username}})
                }
            }
            else{
                console.log('blog not exists')
                let newStore = await likesStore.create(likeData);
                if(newStore){
                    res.json({
                        status:'success',
                        message:'New likes store created for this blog'
                    })
                }
            }    
         })
    }
    catch{
        res.json({
            status:'error',
            message:'An error occured in blog likes route'
        })
    }
})

router.get('/:blogId', async (req,res)=>{
    let {blogId}= req.params;
    await likesStore.findOne({blogId:blogId}).then(exists=>{
        if(exists){
            res.json({
                status:'success',
                data:exists
            })
        }
    }).catch(error=>{
        res.json({
            status:error,
            message:'An error occured while retriving likes for this blog'
        })
    })
})

router.post('/:blogId/comments', async (req,res)=>{
    try {
        let {blogId}=req.params;
        
        let dataToStore = {
            blogId: blogId,
            username: req.body.username,
            userComment: req.body.userComment.userComment,
            commentPostedTime: Date.now(),
        }
        
        let comment = await commentStore.create(dataToStore);
            if(comment){
                console.log(comment);
                res.json({
                    status:'success',
                    data:comment,
                    message:'comment added successfully'
                })
            }
            else{
                res.json({
                    status:'error',
                    message:'An error occured while adding comment to Database'
                })
        }
    } catch (error) {
        res.json({
            status:error,
            message:'An error occures while working on this route'
        })
    }
})

router.get('/:blogId/comments', async (req,res)=>{
    try {
        let {blogId} = req.params;

        commentStore.find({blogId:blogId}).then(comments=>{
            if(comments){
                res.json({
                    data:comments
                })
            }
            else{
                res.json({
                    status:'error',
                    message:'An error occurred while retriving comments'
                })
            }
        })
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occurred in comments get route'
        })
    }
})

router.get('/get-comment/:commentId', async (req,res)=>{
    try {
        const {commentId} = req.params;
        console.log('commentId', commentId);
        let response = await commentStore.findOne({_id:commentId});
        if(response){
            console.log('specific comment', response);
            res.json({
                status:'success',
                data:response
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while fetching a comment'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while finding id for getting comment'
        })
    }
})

router.delete('/remove-comment/:commentId', async (req,res)=>{
    try {
        const {commentId} = req.params;

        let response = await commentStore.findByIdAndDelete({_id:commentId});
        if(response){
            console.log(response);
            await replyStore.deleteMany({commentId:commentId});
            res.json({
                status:'success',
                message:'Comment removed successfully'
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while removing the comment'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while finding a comment to delete'
        })
    }
})

router.patch('/edit-comment/:commentId', async (req, res)=>{
    try {
        const {commentId} = req.params;
        let editedComment = req.body.userComment;
        console.log(commentId, editedComment);

        let response = await commentStore.findOne({_id:commentId});
        if(response){
            let updated_response = await commentStore.findByIdAndUpdate({_id:commentId},{userComment:editedComment},{new:true});
            if(updated_response){
                res.json({
                    status:'success',
                    data:updated_response
                })
            }
            else{
                res.json({
                    status:'error',
                    message:'An error occured while updating the comment'
                })
            }
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while finding a id for updating the comment'
        })
    }
})

router.post('/comment-likes/:commentId', async (req,res)=>{
    try {
        const {commentId} = req.params;
        let {username, likeState} = req.body;
        
        let exists = await commentStore.findOne({_id:commentId, commentLikedBy:username});
        
        if(exists){
            let pulled = await commentStore.findByIdAndUpdate(
                {_id:commentId}, 
                {$pull:{commentLikedBy:username}, $inc:{commentLikes:-1}, $set:{likeState:likeState}},
                {new:true}
            );
            if(pulled){
                res.json({
                    status:'success',
                    data:pulled,
                    message:'like removed from a comment'
                })
            }
        }
        else{
            let pushed = await commentStore.findByIdAndUpdate(
                {_id:commentId}, 
                {$push:{commentLikedBy:username}, $inc:{commentLikes:1}, $set:{likeState:likeState}},
                {new: true}
            );
            if(pushed){
                res.json({
                    status:'success',
                    data:pushed,
                    message:'like added to a comment'
                })
            }
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while looking for comment id to store the likes'
        })
    }
})

router.post('/comment-replies/:commentId', async (req,res)=>{
    try {
        let {commentId, replyText, replyFrom, replyTo} = req.body;
        let replyToStore = {
            commentId:commentId,
            replyText:replyText.userComment,
            replyFrom:replyFrom,
            replyTo:replyTo,
            replyPostedTime:Date.now()
        }

        let response = await replyStore.create(replyToStore);
        if(response){
            let replyId = response._id;
            let comment_response = await commentStore.findByIdAndUpdate({_id:commentId}, {$push:{repliedBy:replyId}}, {new:true});
            res.json({
                status:'success',
                data:comment_response,
                message:'reply added successfully'
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while creating document to store a reply'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while storing reply to DB'
        })
    }
})

router.get('/get-reply/:replyId', async (req,res)=>{
    try {
        let {replyId}=req.params;

        let response = await replyStore.findOne({_id:replyId});
        if(response){
            res.json({
                status:'success',
                data:response,
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while finding a reply with provided id'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while getting reply text'
        })
    }
})

router.patch('/edit-reply/:replyId', async (req,res)=>{
    try {
        let {replyId} = req.params;
        let updtaedReply = req.body.userComment;
        let response = await replyStore.findByIdAndUpdate({_id:replyId},{replyText:updtaedReply},{new:true});
        if(response){
            res.json({
                status:'success',
                data:response
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while storing edited reply'
            })
        }
    } catch (error) {
        re.json({
            status:'error',
            message:'An error occured while edit a reply'
        })
    }
})

router.delete('/remove-reply/:replyId', async (req,res)=>{
    try {
        let {replyId} = req.params;
        let response = await replyStore.findByIdAndDelete({_id:replyId});
        if(response){
            let commentId=response.commentId;
            console.log(commentId);
            let comment_response = await commentStore.findByIdAndUpdate({_id:commentId}, {$pull:{repliedBy:replyId}}, {new:true});
            res.json({
                status:'success',
                data:comment_response
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while finding and removing comment reply'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while removing comment reply'
        })
    }
})

router.post('/reply-likes/:replyId', async (req,res)=>{
    try {
        let {replyId} = req.params;
        let {username, replyState} = req.body;
        
        let exists = await replyStore.findOne({_id:replyId, replyLikedBy:username});
        
        if(exists){
            let pulled = await replyStore.findByIdAndUpdate(
                {_id:replyId}, 
                {$pull:{replyLikedBy:username}, $inc:{replyLikes:-1}, $set:{replyState:replyState}},
                {new:true}
            );
            if(pulled){
                res.json({
                    status:'success',
                    data:pulled,
                    message:'like removed from a comment reply'
                })
            }
        }
        else{
            let pushed = await replyStore.findByIdAndUpdate(
                {_id:replyId}, 
                {$push:{replyLikedBy:username}, $inc:{replyLikes:1}, $set:{replyState:replyState}},
                {new: true}
            );
            if(pushed){
                res.json({
                    status:'success',
                    data:pushed,
                    message:'like added to a comment reply'
                })
            }
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while saving likes of reply'
        })
    }
})

router.get('/comment-replies/:commentId', async (req,res)=>{
    try {
        let {commentId} = req.params;
        let {replyToggleStatus}=req.query;
        console.log(replyToggleStatus);
        let response = await replyStore.find({commentId:commentId});
        console.log(response);
        if(response){
            await commentStore.findByIdAndUpdate({_id:commentId}, {$set:{replyToggleStatus:replyToggleStatus}})
            res.json({
                status:'success',
                data:response,
                message:'replies for this comment fetched successfully'
            })
        }
        else{
            res.json({
                status:'error',
                message:'An error occured while checking for a comment and its replies'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while get replies of a comment'
        })
    }
})
module.exports = router;