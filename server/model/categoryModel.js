const mongoose = require('mongoose');

var categoryschema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    list: {
        type: String,
        enum: ["listed", "unlisted"],
        default: "listed"
    },
    description: {
        type: String,
    }
})


const Categorydb = mongoose.model('categorydb', categoryschema);

module.exports = Categorydb