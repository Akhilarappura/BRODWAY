const mongoose = require('mongoose');
const { type } = require('os');

var Productsschema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true

    },
    category: {
        type: mongoose.Schema.Types.ObjectId, ref: 'categorydb', required: true
    },

    brand: {
        type: String
    },
    price: {
        type: Number,

    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    description: {
        type: String
    },
    list: {
        type: String,
        default: 'listed'
    },
    discount: {
        type: Number,
    },
    stock: {
        type: Number,
        required: true,
    },

    images: {
        type: [String]


    },
    offerPrice: {
        type: Number,
    },
    count:{
        type:Number,
        default:0
    }
})

const productdb = mongoose.model('Product', Productsschema);
module.exports = productdb