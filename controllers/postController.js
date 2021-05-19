const Post = require("../models/Post")
const mongoose = require("mongoose")
const path = require('path');

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
            docs: 'posts'
        }   
    }

    //2 - LOOKUP/JOIN - use $lookup(aggregation) to get the relationship from event to categories (one to many).
    aggregate_options.push({
        $lookup: {
            from: 'users',
            localField: "author",
            foreignField: "_id",
            as: "author"
        }
    });

    //3 - FILTERING TEXT SEARCH
    if (req.query.filter && Object.keys(JSON.parse(req.query.filter)).length) {
        let search = JSON.parse(req.query.filter);

        let match = {};
        for (let key in search) {
            switch(key) {
                case "createdate":
                    const startTime = new Date(search[key]);
                    const endTime = new Date(search[key]);
                    endTime.setDate(endTime.getDate() + 1);

                    match["createdate"] = {$gte: startTime, $lt: endTime }
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
        const myAggregate = Post.aggregate(aggregate_options);
        const result = await Post.aggregatePaginate(myAggregate, options);
        result.posts.forEach(element => element.id = element._id); 
       
        res.setHeader('Content-Range', `${result.posts.length}`)
        res.status(200).json(result.posts);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
}

exports.findOne = async function (req, res) {
    const aggregate_options = [];

    const options = {
        collation: {locale: 'en'},
        customLabels: {
            totalDocs: 'totalResults',
            docs: 'posts'
        }   
    }

    //2 - LOOKUP/JOIN - use $lookup(aggregation) to get the relationship from event to categories (one to many).
    aggregate_options.push({
        $lookup: {
            from: 'users',
            localField: "author",
            foreignField: "_id",
            as: "author"
        }
    });

    aggregate_options.push({
        $lookup: {
            from: 'users',
            localField: "comments.userId",
            foreignField: "_id",
            as: "usersDetailsComments"
        }
    });

    //3 - FILTERING TEXT SEARCH
    aggregate_options.push({$match: {_id: mongoose.Types.ObjectId(req.params.postId)}});

    try {
        const myAggregate = Post.aggregate(aggregate_options);
        const result = await Post.aggregatePaginate(myAggregate, options);
        result.posts.forEach(element => element.id = element._id); 
        // combining userId and userDetails by ID        
        result.posts.forEach(post => {
            post.comments = post.comments.map(comment => ({
                ...comment,
                ...post.usersDetailsComments.find(userDetail => userDetail._id.toString() === comment.userId.toString())
            }));
        })

        res.setHeader('Content-Range', `${result.posts.length}`)
        res.status(200).json(result.posts);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
}

exports.create = async function (req, res) {

    const post = new Post({
        _id: new mongoose.Types.ObjectId,
        title: req.body.title,
        brief: req.body.brief,
        body: req.body.postBody,
        author: req.body.author,
        // comments: []
    })
    
    try{
        const newPost = await post.save();
        res.status(201).json({
            message: 'Post was created',
            create_post: newPost
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.update = async function (req, res) {
    const updatedPost = {};

    for (const [key, value] of Object.entries(req.body)) {
        if (req.body[key]){
            if (key === 'title' || key === 'brief' || key === 'body') {
                updatedPost[key] = req.body[key]
                updatedPost["updateDate"] = Date.now()
            }
            else {
                return res.status(500).json({error: 'Fields are invalid to be updated'})
            }
        }
    }

    try {
        await Post.updateOne({_id: req.params.postId} ,{$set: updatedPost});
        res.status(201).json({
            message: 'Post was updated',
            postId: req.params.id
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
}

exports.delete = async function (req, res) {
    try {
        const result = await Post.deleteOne({_id: req.params.postId});
        res.status(200).json({
            message: 'Post was deleted',
            postId: req.params.id
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.createComment = async function (req, res) {
    const comment = {
        _id: new mongoose.Types.ObjectId,
        title: req.body.title,
        body: req.body.body,
        userId: req.body.userId
    }
    
    try {
        await Post.updateOne(
            { _id: req.params.postId },
            { $push: {
                comments: {
                    $each: [comment],
                    $position: 0
                }
            }}
        );
        res.status(201).json({
            message: 'Comment was created',
            create_comment: comment
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.updateComment = async function (req, res) {
    const updateComment = {};
    for (const [key, value] of Object.entries(req.body)) {
        if (req.body[key] && (key == 'title' || key == 'body')){
            const updateKey = `comments.$.${key}`
            updateComment[updateKey] = req.body[key] 
        }
    }

    try {
        await Post.updateOne(
            { "_id": req.params.postId, "comments._id" : req.params.commentId },
            { $set: updateComment }
        );
        res.status(200).json({
            message: 'Comment was updated'
            // update_comment: result
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.deleteComment = async function (req, res) {
    try {
        await Post.updateOne( 
            {_id: req.params.postId},
            {$pull: {
                comments: {_id: req.params.commentId}}
            }
        );
        res.status(200).json({
            message: 'Comment was deleted'
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    } 
}