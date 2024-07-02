const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    product_name: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
    },
    category_name: {
        type: mongoose.Schema.ObjectId,
        ref: 'categorydb'

    },
    discount_Percentage: {
        type: Number
    },
    startingDate: {
        type: Date,
        default: function () {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);   
            return currentDate

        }
    },
    expiryDate: {
        type: Date,
        default: function () {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            return currentDate

        }
    },
    status: {
        type: String,
        default: 'active',
        enum: ["active", "blocked"]
    }
});

const offerdb = mongoose.model("offerdb", offerSchema);

module.exports = offerdb;
