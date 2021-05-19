const Coupon = require("../models/Coupon")
const mongoose = require("mongoose");


exports.findAll = async (req, res) => {
    const limit_ = 5;
    const aggregate_options = [];

    //1 - PAGINATION - set the options for pagination
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
            docs: 'coupons'
        }   
    }
    
    //2 - FILTERING TEXT SEARCH
    if (req.query.filter && Object.keys(JSON.parse(req.query.filter)).length) {
        let search = JSON.parse(req.query.filter);

        let match = {};
        for (let key in search) {
            switch(key) {
                case "discount":
                    match["discount"] = { $gte: parseFloat(search[key])};
                    break;
                default:
                    match[key] = { $regex: search[key], $options: 'i' };
                    break;
            }
        }
        aggregate_options.push({$match: match});
    }

    //3 - SORT
    if (req.query.sort) {
        let [sortBy, sortCategory] = JSON.parse(req.query.sort)
        sortCategory = sortCategory.toLowerCase() === 'desc'? -1 :1
        aggregate_options.push({$sort: {[sortBy]: sortCategory}});
    }

    try {
        const myAggregate = Coupon.aggregate(aggregate_options);
        const result = await Coupon.aggregatePaginate(myAggregate, options);
        result['coupons'].forEach(element => element.id = element._id); 
        
        res.setHeader('Content-Range', `${result.coupons.length}`)
        res.status(200).json(result.coupons);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
    
}

exports.findOne = async function (req, res) {
    try {
        let coupon = await Coupon.findById(req.params.id);
        coupon = {...coupon, id: coupon._id};

        if (coupon){
            res.status(200).json(coupon);
        }
        else{
            res.status(404).json({message: 'Coupon not found'})
        } 
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.create = async function (req, res) {
    const coupon = new Coupon({
        _id: new mongoose.Types.ObjectId,
        code: req.body.code,
        discount: req.body.discount
    })

    try{
        const newCoupon = await coupon.save();
        res.status(201).json({
            message: 'Coupon was created',
            create_order: newCoupon
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 


}

// exports.update = async function (req, res) {
// }

exports.delete = async function (req, res) {
    try{
        await Coupon.deleteOne({_id: req.params.id});
        res.status(200).json({
            message: 'Coupon was deleted',
            couponId: req.params.id
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}