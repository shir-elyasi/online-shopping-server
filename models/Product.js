const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    actualPrice: {
        type: Number,
        required: true
    },
    stars: {
        type: Number,
        required: true,
        validate: {
            validator: function(num) {
              return Number.isInteger(num) && num >=0 && num <= 5;
            },
            message: 'You must provide an integer between 0 and 5'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    inStock: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    product_images: {
        type: Array,
        required: true
    },
    qtyOrdered: {
        type: Number,
        default: 0
    }
});

productSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('products', productSchema);