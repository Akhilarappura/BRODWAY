const Addressdb = require('../../model/addressModel')
const cartdb = require('../../model/cartmodel')
const orderdb = require('../../model/orderModel')
const userdb = require('../../model/userModel')
const categorydb=require('../../model/categoryModel')
const { use } = require('passport')
const moment = require('moment')




const get_orderpage = async (req, res) => {
    try {

        const user = await userdb.findOne({ email: req.session.email });
        console.log(user, "user");
        const userId = user._id;
        const orders = await orderdb.find({ userId: user._id }).populate('items.productId').sort({ _id: -1 })
        console.log('order', orders)

        const Address = await Addressdb.find({ user: userId })
        console.log(Address, "address");

        res.render('userorder', { Address, orders, detail: user, moment })

    } catch (error) {
        console.log(error.message)
        res.redirect('/error500')

    }
}

//orderComplete-thankyou page

const complete = async (req, res) => {

    try {
        console.log(req.cookies.userToken);
        if (req.cookies.userToken) {
            let cartCount;
            const user = await userdb.findOne({ email: req.session.email })
            const Category = await categorydb.find();
            console.log(user);
            const userId = user._id

            let cart = await cartdb.findOne({ user: userId })
            if (cart) {
                cartCount = cart.items.length
            }
            res.render('order-complete', { userToken: req.cookies.userToken, cartCount: cartCount, user,Category })

        }
    } catch (error) {
        console.log(error);
        res.status(400).render('error500')

    }
}






module.exports = {
    get_orderpage, complete
}