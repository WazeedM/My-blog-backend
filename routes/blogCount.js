const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const {EMAIL, PASSWORD} = require('../env.js');
const Mailgen = require('mailgen');

const blogCountSchema = require('../models/blogsCount');
const readerSchema = require('../models/readersModel');

function sendSubscriptionEmail(emails, blogInfo){
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

        let response = {
            body:{
                name: 'Reader',
                intro: `<strong>${blogInfo.author}</strong> added a new blog on below topic 
                        <div>
                            <strong>${blogInfo.blog_title}</strong><br>
                            ${blogInfo.blog_desc}
                        </div>`,
                action:{
                    instructions: "Continue your reading by tapping the below button",
                    button:{
                        color: '#22BC66',
                        text: 'Read More',
                        link: `https://weblog-wazeedm.vercel.app/blog/${blogInfo.blog_id}`
                    }
                },
                outro: "Need help? or have questions? Just reply to this email, happy to help you"
            }
        }
    
        let mailBody = MailGenerator.generate(response);
        
        let message = {
            from: EMAIL,
            bcc: emails,
            subject:'WebLog | A new blog is added',
            html: mailBody
        }

        transporter.sendMail(message).then(()=>{
            console.log('Notification mail has been shared to subscribers')
        }).catch((error)=>{
            console.log('An error occured while sending notification mail')
        })
}

router.post('/', async (req,res)=>{
    try {
        let readersEmails = await readerSchema.find();
        let emails = readersEmails.filter(reader=>{
            return reader.subscription === true;
        }).map(reader=>{
            return reader.email;
        })

        sendSubscriptionEmail(emails, req.body);
        let blogCount = req.body.blogCount;
        await blogCountSchema.updateOne({count:blogCount});
    } catch (error) {
        res.json({status:'error', message:'blog count error'});
    }
})
router.get('/', async (req, res)=>{
    try {
        let blogsCount = await blogCountSchema.findById({_id:'6421a3728e4c19ebd5d4c742'});
        res.json({
            data:blogsCount
        })
    } catch (error) {
        res.json({status:'error', message:'blog count error'})
    }
})

module.exports = router;