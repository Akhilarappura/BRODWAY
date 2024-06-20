const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userdb',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    }],



}, { timestamps: true });


const wishlistdb = mongoose.model('wishlistdb', wishlistSchema)

module.exports = wishlistdb;