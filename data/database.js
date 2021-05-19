require("dotenv").config()

const mongoose = require("mongoose");
mongoose.connect(
    'mongodb+srv://shir:'+process.env.MONGO_ATLAS_PASS+'@cluster0.uy6vm.mongodb.net/final-project?retryWrites=true&w=majority',
    {useNewUrlParser: true}
)

const db = mongoose.connection;
db.on('error', error => console.log(error));
db.once('open', () => console.log("Connected to Atlas MongoDB!"))
