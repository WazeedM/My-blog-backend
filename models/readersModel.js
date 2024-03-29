const mongoose = require('mongoose');

const readersSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    gender:{
        type: String,
        required: true
    },
    dob:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    verified:{
        type: Boolean
    },
    resetToken:{
        type: String,
        default:''
    },
    subscription:{
        type: Boolean,
        default: false
    }
})
module.exports = mongoose.model('readersModel', readersSchema);