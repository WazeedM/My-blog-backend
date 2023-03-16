const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://personal-projects:personal-projects@cluster0.jkqleim.mongodb.net/?retryWrites=true&w=majority';

const authRouter = require('./routes/auth');
const blogRouter = require('./routes/blog');

app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use('/blog', blogRouter);
app.use('/auth', authRouter);
app.use('/', (req,res)=>{
    res.send('Welcome to my blog');
})



mongoose.set('strictQuery', true);
mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
mongoose.connection.on('open', ()=>{
    console.log('Connected to Database...');
})

app.listen(3000, (err)=>{
    if(!err){
        console.log('Connected to Server on Port 3000');
    }
})
