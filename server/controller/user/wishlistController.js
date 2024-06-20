const categorydb = require('../../model/categoryModel')
const userdb = require('../../model/userModel')
const wishlistdb = require('../../model/wishlistModel');
const cartdb = require('../../model/cartmodel')



const getWishlist = async (req, res) => {
    try {

        const user = req.session.email;
        const userEmail = await userdb.findOne({ email: req.session.email });
        const userId = userEmail._id;
        console.log(userId);
        const wishlist = await wishlistdb.findOne({ user: userId }).populate('items.productId');
        const Category = await categorydb.find()
        const cart = await cartdb.findOne({ user: userId });
        let cartCount = cart ? cart.items.length : 0;

        if (!wishlist) {
            return res.render('wishlist', { wishlist: { items: [] }, user });
        }

        res.render('wishlist', { wishlist, user, Category, userToken: req.cookies.userToken, cartCount });
    } catch (err) {
        console.error(err);
        res.render('error500');
    }
};



const addtowishlist = async (req, res) => {
    try {


        const productId = req.params.id;
        const user = await userdb.findOne({ email: req.session.email });


        let userWish = await wishlistdb.findOne({ user: user._id });
        console.log(userWish, "hi111");
        if (!userWish) {
            const userWish = new wishlistdb({
                user: user._id,
                items: [{ productId: productId }]
            })
            await userWish.save()
        }

        else {
            userWish.items.push({ productId: productId });
            await userWish.save()
            res.redirect('/')
        }



    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}

const deletewishlist = async (req, res) => {
    console.log("hi");

    try {
        const productId = req.params.id;
        const userEmail = await userdb.findOne({ email: req.session.email });
        const user = userEmail._id;

        const userWishlist = await wishlistdb.findOne({ user: user });



        const itemIndex = userWishlist.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).render('error500');
        }

        userWishlist.items.splice(itemIndex, 1);

        await userWishlist.save();
        res.send('success');
    } catch (error) {
        console.error(error);
        res.status(500).send('error500');
    }
};







module.exports = {
    getWishlist, addtowishlist, deletewishlist
}


