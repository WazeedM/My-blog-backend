const nodemailer = require('nodemailer');
const {EMAIL, PASSWORD} = require('../env.js');
const Mailgen = require('mailgen');
const {v4: uuidv4} = require('uuid');

function forgotPassword(req,res){
    // Mail Configuration
    try {
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
    const currentURL = 'http://localhost:4200/';
    
        const email = req.body.email;
        const userData = readersModelSchema.findOne({email});
        console.log(email, userData)
        if(userData){
            console.log('reset');
            const randomString = uuidv4()+userData._id;
            readersModelSchema.updateOne({email},{resetToken: randomString});
            sendResetEmail(userData);
            res.json({
                status:'success',
                message:'Reset email has been sent to your email'
            })
        }
        else{
            res.json({
                status:'not-exist',
                message:'Provided email does not exist in our database'
            })
        }
    } catch (error) {
        res.json({
            status:'error',
            message:'An error occured while verifying email id'
        })
    }

    function sendResetEmail(userInfo){
        console.log('reset email');
        console.log(userInfo);
        let {username, _id, email} = userInfo;
        console.log(username, _id, email);
        
        let response = {
            body:{
                name: username,
                intro: 'Welcome to WebLog. Happy to have you here. Excited to share my knowledge and new learnings with you.',
                action:{
                    instructions: "To get started with WebLog, Please verify your email by clicking the below link. Note that the below link will get expire in  hours after recieving this email",
                    button:{
                        color: '#22BC66',
                        text: 'Verify Your Account',
                        link: `${currentURL}auth/reset-password/${_id}/${randomString}`
                    }
                },
                outro: "Need help? or have questions? Just reply to this email, happy to help you"
            }
        }
    console.log(response);
        let mailBody = MailGenerator.generate(response);
        console.log(mailBody);
        let message = {
            from: EMAIL,
            to: email,
            subject:'WebLog Registration | Email verification',
            html: mailBody
        }
        
        transporter.sendMail(message).then(()=>{
            console.log('Rest mail has been sent');
        }).catch(error=>{
            console.log('An error occured while sending reset email');
        })
    }
}

module.exports = forgotPassword;