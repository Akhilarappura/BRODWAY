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
        category_name: product.category._id, 
        status: 'active'
    });

    if (productOffer && typeof productOffer.discount_Percentage === 'number') {
        product.offerPrice = Math.round(product.price - (product.price * (productOffer.discount_Percentage / 100)));
    } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
        product.categoryOffer = categoryOffer; 
        product.offerPrice = Math.round(product.price - (product.price * (categoryOffer.discount_Percentage / 100)));
    } else {
        product.discountPercentage = 0;
        product.offerPrice = product.price;
    }
    return product;
};


const get_productDetail = async (req, res) => {
    try {
        const id = req.query.id;
        let user = null;
        let wishlist = null;
        let cartCount = 0;
        let productInCart = null;

        const prod = await productdb.findById(id).populate('category');
        await applyoffer(prod);

        const Category = await categorydb.find();
        const coupons = await coupondb.find();

        if (req.session.email) {
            user = req.session.email;
            const userEmail = await userdb.findOne({ email: req.session.email });
            const userId = userEmail._id;

            wishlist = await wishlistdb.findOne({ user: userId }).populate('items.productId');
            console.log('wishlist',wishlist);
            const userCart = await cartdb.findOne({ user: userId });

            if (userCart) {
                productInCart = userCart.items.find(item => item.productId.toString() === id);
                cartCount = userCart.items.length;
            }


            res.render('productdetail', {
                productInCart,
                userToken: req.cookies.userToken,
                user,
                Category,
                cartCount,
                prod,
                coupons,
                wishlist
            });
        } else {
            res.render('productdetail', {
                userToken: undefined,
                Category,
                prod,
                coupons,
                wishlist: null 
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).render("error500");
    }
};



module.exports = {
    get_productDetail
}


