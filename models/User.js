const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const emailPattern = require("../data/constants")
const passwordPattern = require("../data/constants")
const phonePattrern = require("../data/constants")

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String, 
        require: true, 
        unique: true, 
        // match: emailPattern
    },
    password: {
        type: String, 
        require: true,
        // match: passwordPattern
    },
    active: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: "client"
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    phone: {
        type: String,
        match: phonePattrern
    },
    googleUser: {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('users', userSchema);

