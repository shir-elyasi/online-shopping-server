const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const categorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    parent: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    }
});

categorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('categories', categorySchema);
