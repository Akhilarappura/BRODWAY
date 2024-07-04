const Addressdb = require('../../model/addressModel')
const cartdb = require('../../model/cartmodel')
const orderdb = require('../../model/orderModel')
const userdb = require('../../model/userModel')
const categorydb=require('../../model/categoryModel')
const { use } = require('passport')
const moment = require('moment')




const get_orderpage = async (req, res) => {
    try {

        const page=parseInt(req.query.page)||1;
        const perPage=9;
        const startIndex= (page-1)*perPage;
        const user = await userdb.findOne({ email: req.session.email });
        const Category = await categorydb.find();
        const userId = user._id;
        const orders = await orderdb.find({ userId: user._id }).populate('items.productId').sort({ _id: -1 }).skip(startIndex).limit(perPage)
        console.log('order', orders)

        const totalOrders=await orderdb.countDocuments();
        const totalPages=Math.ceil(totalOrders/perPage)

        const sortOption = req.query.sortOption || null;
        const order = req.query.order || null;
        const search = req.query.search || null;




        const Address = await Addressdb.find({ user: userId })
        console.log(Address, "address");
        let cartCount = 0;
        const cart = await cartdb.findOne({ user: userId });
        cartCount = cart ? cart.items.length : 0;


        res.render('userorder', { Address, orders, user, moment,page,totalPages,sortOption,order,search,Category,cartCount,cart, userToken: req.cookies.userToken })

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