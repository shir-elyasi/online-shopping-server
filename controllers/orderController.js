const Order = require("../models/Order")
const mongoose = require("mongoose")
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));


exports.findAll = async (req, res) => {
    const limit_ = 5;
    const aggregate_options = [];

    //1- PAGINATION - set the options for pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || limit_;

    if (req.query.range){
        let [from, to] = JSON.parse(req.query.range)
        limit = to + 1 - from
        page = (to + 1) / limit
    }

    
    const options = {
        page, 
        limit,
        collation: {locale: 'en'},
        customLabels: {
            totalDocs: 'totalResults',
            docs: 'orders'
        }   
    }

    // deconstruct the $categories array using $unwind(aggregation).
    // aggregate_options.push({$unwind: {path: "$products", preserveNullAndEmptyArrays: true}});

    // 2 - LOOKUP/JOIN - use $lookup(aggregation) to get the relationship from event to categories (one to many).
    aggregate_options.push({
        $lookup: {
            from: 'products',
            localField: "products.productId",
            foreignField: "_id",
            as: "products"
        }
    });

    // aggregate_options.push({
    //     $project: {
    //         products: { 
    //             $map: { 
    //                 input: "$products", 
    //                 as: "product", 
    //                 in: { 
    //                     name: "$$products.name", 
    //                     price: "$$products.price" 
    //                 } 
    //             } 
    //        } 
    //     }
    // });

    // aggregate_options.push({
    //     $group: {
    //         _id: { $dateToString: {format: "%Y-%m-%d", date: "$createdAt"} },
    //         data: {$push: "$$ROOT"}
    //     }
    // });
    
    //3 - FILTERING TEXT SEARCH
    if (req.query.filter && Object.keys(JSON.parse(req.query.filter)).length) {
        let search = JSON.parse(req.query.filter);

        let match = {};
        for (let key in search) {
            switch(key) {
                case "date_gte": // for dashborad usages
                    match["createdAt"] = { $gte: new Date(search[key])};
                    break;
                case "createdAt":
                    const startTime = new Date(search[key]);
                    const endTime = new Date(search[key]);
                    endTime.setDate(endTime.getDate() + 1);

                    match["createdAt"] = {$gte: startTime, $lt: endTime }
                    break;
                default:
                    match[key] = { $regex: search[key], $options: 'i' };
                    break;
            }
        }

        aggregate_options.push({$match: match});
    } 

    //4 - SORT
    if (req.query.sort) {
        let [sortBy, sortOrder] = JSON.parse(req.query.sort)
        sortOrder = sortOrder.toLowerCase()==='desc'? -1 :1
        aggregate_options.push({$sort: {[sortBy]: sortOrder}});
    }

    try {
        const myAggregate = Order.aggregate(aggregate_options);
        const result = await Order.aggregatePaginate(myAggregate, options);
        result['orders'].forEach(element => element.id = element._id); 
       
        res.setHeader('Content-Range', `${result.orders.length}`)
        res.status(200).json(result.orders);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
    
}

exports.findOne = async function (req, res) {
    try{
        let order = await Order.findById(req.params.id);
        order = {...order, id: order._id};

        if (order){
            res.status(200).json(order);
        }
        else{
            res.status(404).json({message: 'Order not found'})
        } 
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.create = async function (req, res) {

    const order = new Order({
        _id: new mongoose.Types.ObjectId,
        subtotalAmount: req.body.subtotalAmount,
        taxesAmount: req.body.taxesAmount,
        couponCode: req.body.couponCode,
        couponDiscountAmount: req.body.couponDiscountAmount,
        deliveryAmount: req.body.deliveryAmount,
        totalAmount: req.body.totalAmount,
        deliveryMethod: req.body.deliveryMethod,
        products: req.body.products,
        recipient: req.body.recipient,
        userId: req.body.userId
    })
    
    try {
        const newOrder = await order.save();

        transporter.sendMail({
            to: req.body.email,
            from: process.env.EMAIL_ADDRESS,
            subject: "Home Style - Order Confirmation",
            html: `<h2>Your order was successfully placed.</h2><h3>Order Id:</h3><h3>${order._id}`
        })

        res.status(201).json({
            message: 'Order was created',
            create_order: newOrder
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.update = async function (req, res) {
    const updatedOrder = {};

    for (const [key, value] of Object.entries(req.body)) {
        if (req.body[key] && (key === 'status' || key === 'recipient')){
            updatedOrder[key] = req.body[key]
        }
        else if(key !== 'status' || key !== 'recipient'){
            return res.status(500).json({error: 'Fields are invalid to be updated'})
        }
    }

    try{
        await Order.updateOne({_id: req.params.id} ,{$set: updatedOrder});
        res.status(201).json({
            message: 'Order was updated',
            orderId: req.params.id
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    }
}

exports.delete = async function (req, res) {
    try{
        await Order.deleteOne({_id: req.params.id});
        res.status(200).json({
            message: 'Order was deleted',
            orderId: req.params.id
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.findUserOrders = async function (req, res) {
    const aggregate_options = [];

    const options = {
        collation: {locale: 'en'},
        customLabels: {
            totalDocs: 'totalResults',
            docs: 'orders'
        }   
    }

    // 2 - LOOKUP/JOIN - use $lookup(aggregation) to get the relationship from event to categories (one to many).
    aggregate_options.push({
        $lookup: {
            from: 'products',
            localField: "products.productId",
            foreignField: "_id",
            as: "productsDetails"
        }
    });
    
    //FILTER BY USER ID 
    aggregate_options.push({$match: {"userId" : mongoose.Types.ObjectId(req.params.userId) }});

    //SORT BY DATE
    aggregate_options.push({$sort: {"createdAt": 1}});

    try {
        const myAggregate = Order.aggregate(aggregate_options);
        const result = await Order.aggregatePaginate(myAggregate, options);
        
        // combining products  and productsDetails by ID        
        result.orders.forEach(order => {
            order.products = order.products.map(product => ({
                ...product,
                ...order.productsDetails.find(productsDetail => productsDetail._id.toString() === product.productId.toString())
            }));
        })

        res.setHeader('Content-Range', `${result.orders.length}`)
        res.status(200).json(result.orders);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
    
}

