const userdb = require('../../model/userModel')
const productdb = require('../../model/productModel')
const cartdb = require('../../model/cartmodel')
const jwt = require('jsonwebtoken')
const categorydb = require('../../model/categoryModel')
const wishlistdb = require('../../model/wishlistModel')
const offerdb = require('../../model/offerModel')



//adminlogin
const adminlog = async (req, res) => {
    if (req.cookies.adminToken) {

        res.redirect('/admin')
    } else {
        res.render('adminsignin')
    }
}



const adminsign = async (req, res) => {
    if (req.cookies.adminToken) {
        res.redirect('/admin')
    } else {
        try {
            const credential = {
                email: 'admin123@gmail.com',
                password: 'password',
            };
            if (req.body.email == credential.email && req.body.password == credential.password) {
                const adminToken = jwt.sign(
                    { email: credential.email },
                    'your_key',
                    { expiresIn: '1h' }
                );
                //set the token in the response cookie 
                res.cookie('adminToken', adminToken)

                res.redirect('/admin')
            } else {
                res.redirect('/adminsignup?pass=wrong')
            }
        }
        catch (error) {
            console.error(error);
            res.redirect('/?error=login_failed')
        }
    }

};

const adm_logout = async (req, res) => {
    res.clearCookie('adminToken')
    res.redirect('/adminsignup')
}

const admindash = async (req, res) => {
    res.render('adminDashboard')
}



//index
const applyoffer = async (product) => {
    if (!product) {
        return null;
    }

    try {
        const productOffer = await offerdb.findOne({
            product_name: product._id,
            status: 'active'
        });

        const categoryOffer = await offerdb.findOne({
            category_name: product.category._id, // Ensure this matches the field used in product's schema
            status: 'active'
        });

        if (productOffer && typeof productOffer.discount_Percentage === 'number') {
            product.offerPrice = Math.round(product.price - (product.price * (productOffer.discount_Percentage / 100)));
            console.log("Applied product offer");
        } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
            product.offerPrice = Math.round(product.price - (product.price * (categoryOffer.discount_Percentage / 100)));
            console.log("Applied category offer");
        } else {
            product.offerPrice = product.price;
            console.log("No offers applied");
        }
    } catch (error) {
        console.error('Error applying offer:', error);
    }

    return product;
};




const index = async (req, res) => {
    try {
        let user = null;
        let cartCount = 0;
        let wishlist = null;
        const products = await productdb.find().populate('category');
        
        const Category = await categorydb.find();

        for (const product of products) {
            await applyoffer(product);
        }


        if (req.cookies.userToken) {
            user = await userdb.findOne({ email: req.session.email });
            const userId = user._id;

            const cart = await cartdb.findOne({ user: userId });
            cartCount = cart ? cart.items.length : 0;
            wishlist = await wishlistdb.findOne({ user: userId });
            
        res.render('index', { products, userToken: req.cookies.userToken, cartCount, user, wishlist, Category });

        }else{
            res.render('index', { products, userToken: undefined, cartCount:0,  wishlist:0, Category });
        }

        

    } catch (error) {
        console.error('Error rendering index page:', error);
        res.render('error500')
    }
};































module.exports = {
    adminlog, adminsign, adm_logout, index, admindash, applyoffer
}