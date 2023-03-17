const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const {EMAIL, PASSWORD} = require('../env.js');
const Mailgen = require('mailgen');
const {v4: uuidv4} = require('uuid');
const bcrypt = require('bcryptjs');
const readersModelSchema = require('../models/readersModel');
const readerVerification = require('../models/readerVerification');
 
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/verifyToken');

const secretKey = 'kjdfsjoerjjfk#jkdfjdl@sjflj$werdgs';

router.post('/login', async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;

    await readersModelSchema.findOne({email: email}).then(existUser=>{
        if(!existUser.verified){
            res.json({
                status:'pending',
                message:'Your email verification is pending. Please check your email and verify.'
            })
        }
        else if(existUser){
                bcrypt.compare(password, existUser.password, function(err, response){
                    console.log(err, response);
                    if(!err){
                        if(response){
                            const authToken = jwt.sign({_id: existUser._id, email: existUser.email, username: existUser.username}, secretKey, {
                                expiresIn:'1h'
                            })
                            res.json({status:'ok', data: {authToken, response, existUser}});
                        }else if(!response){
                            res.json({
                                status:'pwd-error',
                                response:response,
                                message:'password is incorrect'
                            })
                        }
                    }
                })
        }
    }).catch(err=>{
        console.log('User not exists in our Database');
        res.json({status:'user-not-exist', data:'User not exists in our Database'})
    })
})

router.post('/signup', async (req,res)=>{
    const registerUserData = {
        username: req.body.username,
        email: req.body.email,
        gender: req.body.gender,
        dob: req.body.dob,
        password: req.body.password,
        verified: false
    }

    await readersModelSchema.findOne({email:registerUserData.email}).then(exists=>{
        if(exists){
            res.json({status:'error', data: {exists}})
        }
        else{
            createUser();
        }
    })
    async function createUser(){
        console.log('create user')
        const salt = await bcrypt.genSalt(10);
        await bcrypt.hash(req.body.password, salt).then(hashedPassword=>{
            if(hashedPassword){
                registerUserData.password = hashedPassword;
            }
        })
    
        await readersModelSchema.create(registerUserData).then(userStoreData=>{
            console.log(userStoreData);
            if(userStoreData && userStoreData._id){
                console.log('user data is stored', userStoreData);
                res.json({status:'ok', data:userStoreData});
                sendVerificationEmail(userStoreData, res);
            }
        }).catch(err=>{
            if(err){
                res.json({status:'error', data:err})
            }
        })
    }

    // Send Verification Email
    function sendVerificationEmail(userData, res){
        const {_id, username, email} = userData;
        // const user_id = userData._id;
        // Mail Configuration
        let config = {
            service:'gmail',
            auth: {
                user:EMAIL,
                pass:PASSWORD
            }
        }
        let transporter = nodemailer.createTransport(config);
        let MailGenerator = new Mailgen({
            theme:'default',
            product:{
                name:'Mailgen',
                link:'https//mailgen.js'
            }
        })
        const currentURL = 'https://weblog-wazeedm.vercel.app/';
        const uniqueString = uuidv4() + _id;
        let response = {
            body:{
                name: username,
                intro: 'Welcome to WebLog. Happy to have you here. Excited to share my knowledge and new learnings with you.',
                action:{
                    instructions: "To get started with WebLog, Please verify your email by clicking the below link. Note that the below link will get expire in 7 hours after recieving this email",
                    button:{
                        color: '#22BC66',
                        text: 'Verify Your Account',
                        link: `${currentURL}auth/verify/${_id}/${uniqueString}`
                    }
                },
                outro: "Need help? or have questions? Just reply to this email, happy to help you"
            }
        }
    
        let mailBody = MailGenerator.generate(response);
        
        let message = {
            from: EMAIL,
            to: email,
            subject:'WebLog Registration | Email verification',
            html: mailBody
        }
        

        // hash the uniqueString
        const saltRounds = 10;
        bcrypt.hash(uniqueString, saltRounds)
        .then((hashedUniqueString)=>{
            const newreaderVerification = new readerVerification({
                readerId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 25200000,
            })

            newreaderVerification.save()
            .then(()=>{
                transporter.sendMail(message).then(()=>{
                    console.log('Verification email has been sent')
                }).catch((error)=>{
                    console.log('An error occured while sending verification mail')
                })
            })
            .catch((error)=>{
                res.json({
                    status:'Failed',
                    message:"Couldn't save reader verification data"
                })
            })
        })
        .catch(()=>{
            res.json({
                status:'Failed',
                message:'An error occured while hashing the unique string for reader verification'
            })
        })
    }
})

router.get('/verify/:userId/:uniqueString', async (req,res)=>{
    let {userId, uniqueString} = req.params;
    console.log('verification');
    await readerVerification.find({userId})
    .then((result)=>{
        if(result.length>0){
            console.log('result', result);
            const {expiresAt} = result[0];
            const hashedUniqueString = result[0].uniqueString;
            console.log(Date.now(), expiresAt);
            if(expiresAt<Date.now()){
                readerVerification.deleteOne({userId})
                .then((result)=>{
                    readersModelSchema.deleteOne({_id: userId})
                    .then(()=>{
                        res.json({
                            status:'expired',
                            message:'Link has been expired. Please signup again'
                        })
                    })
                    .catch(error=>{
                        res.json({
                            status:'failed',
                            message:'An error occured while deleting reader record whose verification record is expired'
                        })
                    })
                })
                .catch((error)=>{
                    res.json({
                        status:'failed',
                        message:'An error occured while deleting expired reader verification record'
                    })
                })
            }
            else{
                // Compare the unique string from params with hashed unique string from DB

                bcrypt.compare(uniqueString, hashedUniqueString)
                .then(result=>{
                    if(result){
                        readersModelSchema.updateOne({_id:userId}, {verified:true})
                        .then(()=>{
                            readerVerification.deleteOne({userId})
                            .then(()=>{
                                console.log('success');
                                res.json({
                                    status:'success',
                                    message:'Reader has been successfully verified. Login and start learning'
                                })
                            })
                            .catch(error=>{
                                res.json({
                                    status:'failed',
                                    message:'An error occurred while finalizing the reader successful verification'
                                })
                            })
                        })
                        .catch(error=>{
                            res.json({
                                status:'failed',
                                message:'An error occured while updating reader verification status'
                            })
                        })
                    }
                    else{
                        res.json({
                            message:'Invalid verification details has been passed. click the link recieved on your email or copy paste the link in your browser address'
                        })
                    }
                })
                .catch(error=>{
                    res.json({
                        status:{'error': error},
                        message:'An error occured while comparing the params uinque string with the hashed string in DB'
                    })
                })
            }
        }
        else{
            res.json({
                status:'not-exist-or-verified',
                message:"Account record doesn't exist or has been verified already. Please sign up or login" 
            })
        }
    })
    .catch((error)=>{
        res.send({
            status:'Failed',
            message:'An error occured while checking for an existing reader for verification'
        })
    })

})


router.get('/dashboard', verifyToken, async (req,res)=>{
    if(req && req.decodedToken){
        res.json({status:'ok', data:'ok'})
    }
})
router.post('/reset-password/:resetToken', async (req,res)=>{
    try{
        const {resetToken} = req.params;
        console.log(resetToken);
        const tokenData = await readersModelSchema.findOne({resetToken});
        if(tokenData){
            res.on('data', console.log);
            const password = req.body.password;
            console.log(password);
            const salt = await bcrypt.genSalt(10);
            await bcrypt.hash(password, salt).then( async (hashedPassword)=>{
                if(hashedPassword){
                    console.log(hashedPassword);
                   const data  = await readersModelSchema.findByIdAndUpdate({_id:tokenData._id},{password:hashedPassword, resetToken:''}, {new:true});
                   console.log(data);
                    res.json({
                        status:'success',
                        message:'New password has been updated to your record. Please login'
                    })
                }
            })
            
        }
        else{
            res.json({
                status:'not-valid',
                message:'link is not valid'
            })
        }
    }
    catch(error){
        res.json({
            status:'error',
            message:'An error occurred while resetting the password'
        })
    }
})
router.post('/forgot-password', async (req,res)=>{

    try {
        const email = req.body.email;
        const userData = await readersModelSchema.findOne({email});
        
        if(userData){
           const randomString = uuidv4()+userData._id;
            if(userData.resetToken === ''){
                await readersModelSchema.findOneAndUpdate({email:email},{$set:{resetToken: randomString}}, {new: true})
                .then((tokenData)=>{
                    if(tokenData){
                        sendResetEmail(tokenData);
                        res.json({
                            status:'success',
                            message:'Reset email has been sent to your email'
                        })
                    }
                })
                .catch(error=>{
                    res.json({
                        status:'error',
                        message:'An error occured while updating the reset token'
                    })
                })
            }
            else{
                console.log('already reset mail has been sent to your registered email id. Please check your mail box')
                res.json({
                    status:'already-sent',
                    message:'Already reset mail has been sent to your registered email id. Please check your mail box'      
                })
            }
        }
        else{
            res.json({
                status:'not-exist',
                message:'Provided email incorrect or does not exist in our database'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while verifying email id'
        })
    }

    async function sendResetEmail(userInfo){
        console.log('userInfo',userInfo);
        // let {username, _id , email, resetToken} = userInfo;
        let {username, email, resetToken} = userInfo;
        
        // Mail Configuration
        let config = {
            service:'gmail',
            auth: {
                user:EMAIL,
                pass:PASSWORD
            }
        }
        let transporter = nodemailer.createTransport(config);
        let MailGenerator = new Mailgen({
            theme:'default',
            product:{
                name:'Mailgen',
                link:'https//mailgen.js'
            }
        })
        const currentURL = 'https://weblog-wazeedm.vercel.app/';

        let response = {
            body:{
                name:username,
                action: {
                    instructions: 'To reset your password we have created the below link, Please click and follow the instructions shown on screen',
                    button: {
                        color: '#48cfad', 
                        text: 'Reset Password',
                        link: `${currentURL}auth/reset-password/${resetToken}`
                    }
                },
                outro: "Need help? or have questions? Just reply to this email, happy to help you"
            }
        }
        
        let mailBody = MailGenerator.generate(response);
        
        let message = {
            from: EMAIL,
            to: email,
            subject:'WebLog | Reset Password',
            html: mailBody
        }
        await transporter.sendMail(message).then(()=>{
            console.log('Password reset link has been sent to your registered email id');
        }).catch(error=>{
            console.log('An error occured while sending password reset email');
        })
        
    }
})
module.exports = router;