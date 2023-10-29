//create an model of FoundItems from FormFound.ejs
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create model for founditem
const ItemSchema = new Schema({
    itemName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    secondaryColor: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    description: {
        type: String,
        
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    image:{
            type: String,
            required: true
    }
    ,
    username: { 
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    itemStatus: {
        type: String,
        required: true
    }
})

const Item = mongoose.model('Items',ItemSchema);
module.exports = Item;