const mongoose = require('mongoose');

const blogsCount = new mongoose.Schema({
    count:Number
})
module.exports = mongoose.model('blogsCount', blogsCount);