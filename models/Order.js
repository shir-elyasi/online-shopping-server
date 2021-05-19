const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const recipientSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'first name is required']
    },
    lastName: {
        type: String,
        required: [true, 'last name is required']
    },
    phone: {
        type: String,
        required: [true, 'phone number is required'],
        match: /^0\d{1,2}\d{7}/
    },
    city: {
        type: String,
        required: [true, 'city is required']
    },
    street: {
        type: String,
        required: [true, 'street is required']
    },
    homeNumber: {
        type: Number,
        required: [true, 'home number is required']
    },
    apartmentNumber: {
        type: Number
    }
})

const orderedProducts = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'product id is required'],
        ref: 'Product'
    }, 
    quantity: {
        type: Number,
        default: 1
    }
})

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    status: {
        type: String,
        validate: {
            validator: function(status) {
                const validStatus = ['ordered', 'in proccess', 'confirmed', 'sent', 'received', 'returned']
                return validStatus.find(element => element === status);
            },
            message: 'You must provide a valid status'
        },
        default: 'ordered'
    },
    subtotalAmount: {
        type: Number,
        required: [true, 'subtotal amount is required']
    },
    taxesAmount: {
        type: Number,
        required: [true, 'taxes amount is required']
    },
    couponCode: {
        type: String
    },
    couponDiscountAmount: {
        type: Number
    },
    deliveryAmount: {
        type: Number,
        required: [true, 'delivery amount is required']
    },
    totalAmount: {
        type: Number,
        required: [true, 'total amount is required']
    },
    deliveryMethod: {
        type: String,
        validate: {
            validator: function(deliveryMethod) {
                const validDeliveryMethod = ['ordered', 'in proccess', 'confirmed', 'sent', 'received', 'returned']
                return validDeliveryMethod.find(element => element === deliveryMethod);
            },
            message: 'You must provide a valid status'
        },
        required: [true, 'first name is required']
    },
    products: [ orderedProducts ],
    recipient: {
        type: recipientSchema,
        required: [true, 'recipient details are required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'user id is required']
    }
});

orderSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('orders', orderSchema);


    // recipient: {
    //     firstName: {type:String, required:true}
    // },

    // orderedProducts: [ {
    //     productId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         required: true,
    //         ref: 'Product'
    //     }, 
    //     quantity: {
    //         type: Number,
    //         default: 1
    //     }
    // } ],