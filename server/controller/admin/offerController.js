const mongoose = require('mongoose');
const Categorydb = require("../../model/categoryModel");
const offerdb = require("../../model/offerModel");
const productdb = require("../../model/productModel");
const moment = require('moment')





const getOffer = async (req, res) => {
    try {


        const offers = await offerdb.find()
            .populate('product_name')
            .populate('category_name', 'categoryName');

        offers.forEach(offer => {
            offer.formattedExpiryDate = moment(offer.expiryDate).format('DD/MM/YYYY');
        });


        res.render('adminOffer', { offers })

    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}

const getAddOffer = async (req, res) => {
    try {
        const products = await productdb.find({}, 'product_name');
        const categories = await Categorydb.find({}, 'categoryName');

        res.render('adminAddOffer', { products, categories, errorMessage: '' });

    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}

const postAddOffer = async (req, res) => {
    try {
        const { offerName, offerType, productId, categoryId, productDiscount, categoryDiscount, StartingDate, expiryDate } = req.body;
        if (offerType === 'category' && !categoryId) {
            return res.status(400).send('category ID is  required for category Offer');
        }
        if (offerType === 'product' && !productId) {
            return res.status(400).send('product ID is required for product offer')
        }

        //checking if exists
        let productExists = true;
        let categoryExists = true;

        if (productId) {
            productExists = await productdb.exists({ _id: productId })
        }
        if (categoryId) {
            categoryExists = await Categorydb.exists({ _id: categoryId })
        }
        if (!productExists) {
            return res.status(400).send("The selected product does not exist");
        }
        if (!categoryExists) {
            return res.status(400).send("The selected category does not exist");
        }

        // Check if an offer already exists for the same product or category

        const existingOffer = offerType === 'product'
            ? await offerdb.findOne({ product_name: productId })
            : await offerdb.findOne({ category_name: categoryId })

        if (existingOffer) {
            const errorMessage = `An offer already exists for the selected ${offerType}`;
            const products = await productdb.find({}, 'product_name');
            const categories = await Categorydb.find({}, 'categoryName');
            return res.render('adminAddOffer', { products, categories, errorMessage });
        }

        const newOffer = new offerdb({
            offerName,
            offerType,
            product_name: mongoose.Types.ObjectId.isValid(productId) ? productId : null,
            category_name: mongoose.Types.ObjectId.isValid(categoryId) ? categoryId : null,
            discount_Percentage: productDiscount || categoryDiscount,
            expiryDate,
            unlist: false
        });
        console.log('newoffer', newOffer);

        await newOffer.save();
        res.redirect('/offer');


    } catch (error) {
        console.log(error);
        res.redirect('/error500')
    }
}


console.log("hi");

const unlistOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        console.log(offerId);

        const offers = await offerdb.findById(offerId);
        offers.status = offers.status === 'active' ? 'blocked' : 'active';
        await offers.save()


        res.redirect('/offer');
    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}


module.exports = {
    getOffer,
    getAddOffer,
    postAddOffer,
    unlistOffer
}