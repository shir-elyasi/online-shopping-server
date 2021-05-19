const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const commentsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const postSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    createdate: {
        type: Date,
        default: Date.now
    },
    updateDate: {
        type: Date
    },
    brief: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    comments: [ commentsSchema ],
});

postSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('posts', postSchema);