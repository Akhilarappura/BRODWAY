const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userdb',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
      
    },
    landmark: String,
    alternateMobile: String,

}, { timestamps: true }); 

const Addressdb = mongoose.model('addressdb', addressSchema);

module.exports = Addressdb;