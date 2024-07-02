const mongoose=require('mongoose');
const { type } = require('os');

var couponSchema=new mongoose.Schema({
    couponcode:{
        type:String
    },
    expireDate:{
        type:Date
    },
    minPurchaseAmount:{
        type:Number
    },
    maxDiscount:{
        type:Number
    },
    discountPercentage:{
        type:Number

    }
})

const coupondb=mongoose.model('coupondb',couponSchema)


module.exports=coupondb;