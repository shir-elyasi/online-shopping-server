const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { OAuth2Client } = require('google-auth-library');
const { use } = require("../routes/users");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));


exports.signup = async function (req, res) {
    const userExist = await User.findOne({email: req.body.email})

    if(!userExist) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err){
                console.log(err);
                return res.status(500).json({error: err})
            }
            else {
                const user = new User ({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.email,
                    password: hash,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName
                })
                user.save()
                .then( result => {
                    res.status(201).json( {message: 'User created successfully'} );
                    
                    transporter.sendMail({
                        to: req.body.email,
                        from: process.env.EMAIL_ADDRESS,
                        subject: "Home Style - Signup",
                        html: "<h1>You successfully signed up to Home Style store!</h1>"
                    })
                })
                .catch(err => {
                    console.log(err)
                    res.status(500).json({error: err})
                })
            }
        })
    }
    else {
        res.status(500).json({error: "Email already exist"});
    }

    
}

exports.login = async function (req, res) {
    const user = await User.findOne({email: req.body.email})

    if (user && !user.googleUser) {
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err || !result) {
                console.log(err);
                res.status(401).json({message: 'Authentication failed'})
            }
            else {
                const token = jwt.sign( 
                    { email: user.email, userId: user._id }, 
                    process.env.JWT_KEY,
                    { expiresIn: "1h"}
                );
                
                res.status(200).json({
                    message: 'Authentication successful',
                    token : token,
                    user: user
                })
            }
        })
    }
    else {
        res.status(500).json({error: "User not exist"})
    }
}

exports.loginGoogle = async function (req, res) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.tokenGoogle,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, given_name, family_name } = ticket.getPayload();

        await User.updateOne( 
            { email: email },
            { 
                email: email,
                firstName: given_name,
                lastName: family_name,
                active: true,
                role: 'client',
                password: null,
                googleUser: true
            },
            { upsert: true }
        )

        const user = await User.findOne({email: email})
        
        const token = jwt.sign( 
            { email: user.email, userId: user._id }, 
            process.env.JWT_KEY,
            { expiresIn: "1h"}
        );
        
        res.status(200).json({
            message: 'Authentication successful',
            token : token,
            user: user
        })
    } 
    catch(err) { 
        console.log(err)
        return res.status(401).json({ message: 'Auth failed'})
    }
}

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
            docs: 'users'
        }   
    }
    
    //3 - FILTERING TEXT SEARCH
    if (req.query.filter && Object.keys(JSON.parse(req.query.filter)).length) {
        let search = JSON.parse(req.query.filter);

        let match = {};
        for (let key in search) {
            if (!Array.isArray(search[key])) {
                switch(key) {
                    case "active":
                        match["active"] = search[key];
                        break;
                    default:
                        match[key] = { $regex: search[key], $options: 'i' };
                        break;
                }
            }
        }
        aggregate_options.push({$match: match});
    }

    //4 - SORT
    if (req.query.sort) {
        let [sortBy, sortUser] = JSON.parse(req.query.sort)
        sortUser = sortUser.toLowerCase()==='desc'? -1 :1
        aggregate_options.push({$sort: {[sortBy]: sortUser}});
    }
    

    try {
        const myAggregate = User.aggregate(aggregate_options);
        const result = await User.aggregatePaginate(myAggregate, options);
        result['users'].forEach(element => element.id = element._id); 

        
        res.setHeader('Content-Range', `${result.users.length}`)
        res.status(200).json(result.users);
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }

    
}

exports.findOne = async function (req, res) {
    try{
        const result = await User.findById(req.params.id);
        if (result){
            res.status(200).json(result);
        }
        else{
            res.status(404).json({message: 'User not found'})
        } 
    }
    catch(err){
        console.log(err)
        res.status(500).json({error: err})
    } 
}

exports.update = async function (req, res) {
    const currentUser = await User.findOne({_id: req.params.id});

    const updatedUser = {};
    for (const [key, value] of Object.entries(req.body)) {
        if (req.body[key]){
            if (key == 'email') {
                const userExist = await User.findOne({email: req.body.email})

                if ( (currentUser.email != req.body.email) && userExist) {
                    return res.status(500).json({error: 'Email allready exist'})
                }
                else {
                    updatedUser[key] = req.body[key]
                }
            }
            else if (key === 'firstName' || key === 'lastName' || key === 'phone') {
                updatedUser[key] = req.body[key]
                updatedUser["updateDate"] = Date.now()
            }
            else {
                return res.status(500).json({error: 'Fields are invalid to be updated'})
            }
        }
    }

    try {
        await User.updateOne({_id: req.params.id} ,{$set: updatedUser});
        res.status(201).json({
            message: 'User details were updated',
            userId: req.params.id
        })
    }
    catch(err) {
        console.log(err)
        res.status(500).json({error: err})
    }
}

exports.updatePassword = async function (req, res) {
    const user = await User.findOne({_id: req.params.id});

    //Compare provided currnt password to database currnt password
    bcrypt.compare(req.body.currentPassword, user.password, (err, result) => {
        if (err){
            console.log(err);
            return res.status(401).json({message: 'Authentication failed'})
        }
        else if (!result) {
            return res.status(401).json({message: 'Authentication failed - Wrong password'})
        }
    })

    //Create new password
    bcrypt.hash(req.body.newPassword, 10, (err, hash) => {
        if (err){
            console.log(err);
            return res.status(500).json({error: err})
        }
        else {
            User.updateOne({_id: req.params.id} ,{$set: {password: hash}})
            .then( result => {
                return res.status(201).json({
                    message: 'Password updated successfully',
                    userId: req.params.id
                })
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({error: err})
            })
        }
    })
    
}