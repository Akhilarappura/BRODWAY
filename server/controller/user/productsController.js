const categorydb = require('../../model/categoryModel');
const productdb = require('../../model/productModel');
const offerdb = require('../../model/offerModel')
const express = require('express');
const addressdb = require('../../model/addressModel')
const cartdb = require('../../model/cartmodel');
const userdb = require('../../model/userModel');
const coupondb = require('../../model/couponModel');
const wishlistdb = require('../../model/wishlistModel');




//user




const applyoffer = async (product) => {
    if (!product) {
        return null
    }

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
    } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
        product.categoryOffer = categoryOffer; // Assign category offer to the product
        product.offerPrice = Math.round(product.price - (product.price * (categoryOffer.discount_Percentage / 100)));
    } else {
        product.discountPercentage = 0;
        product.offerPrice = product.price;
    }
    return product;
};


const get_productDetail = async (req, res) => {

    try {
        const id = req.query.id
        if (req.session.email) {


            const prod = await productdb.findById(id).populate('category')
            const user = req.session.email;
            const userEmail = await userdb.findOne({ email: req.session.email });
            const userId = userEmail._id;
            console.log('user',user);
            const wishlist = await wishlistdb.findOne({ user: userId }).populate('items.productId');
            console.log('wishlist',wishlist);

            const detail = await userdb.findOne({ email: user })
            const Category = await categorydb.find()
            const userCart = await cartdb.findOne({ user: user._id })
            const coupons = await coupondb.find()
            const address = await addressdb.find({ user: detail._id })
            let cartCount
            let productInCart = null;
            if (userCart) {
                productInCart = userCart.items.find(item => item.id.toString() === id);
            }


            let cart = await cartdb.findOne({ user: user._id })
            if (!cart) {
                cartCount = 0;
            }
            else {
                cartCount = cart.items.length
            }

            await applyoffer(prod)
            console.log('products', prod);

            res.render('productdetail', { productInCart, userToken: req.cookies.userToken, user, Category, cartCount: cartCount, prod, coupons, address,wishlist })
        } else {
            console.log('id', id);

            const Category = await categorydb.find()
            const prod = await productdb.findById(id).populate('category')
            const coupons = await coupondb.find()




            await applyoffer(prod)
            console.log('products', prod);

            res.render('productdetail', { userToken: undefined, Category, prod, coupons })

        }
    } catch (error) {
        console.log(error);
        res.status(500).render("error500")
    }
}



module.exports = {
    get_productDetail
}


