const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const couponSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    code: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    }
});

couponSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('coupons', couponSchema);
