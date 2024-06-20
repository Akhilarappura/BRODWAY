const productdb = require("../../model/productModel");
const offerdb = require('../../model/offerModel')
const Categorydb = require("../../model/categoryModel");
const userdb = require("../../model/userModel");

const applyoffer = async (sortedProducts) => {
    if (!sortedProducts) {
        return null;
    }

    try {
        const productOffer = await offerdb.findOne({ product_name: sortedProducts._id, status: 'active' })
        const categoryOffer = await offerdb.findOne({ category_name: sortedProducts.Category, status: 'active' });

        sortedProducts.originalPrice = sortedProducts.price;


        console.log(productOffer, sortedProducts, "hi");
        if (productOffer && typeof productOffer.discount_Percentage === 'number') {
            sortedProducts.offerPrice = Math.round(sortedProducts.price - (sortedProducts.price * (productOffer.discount_Percentage / 100)));
            console.log("Applied product offer");
        } else if (categoryOffer && typeof categoryOffer.discount_Percentage === 'number') {
            sortedProducts.offerPrice = Math.round(sortedProducts.price - (sortedProducts.price * (categoryOffer.discount_Percentage / 100)));
            console.log("Applied category offer");
        } else {
            sortedProducts.offerPrice = sortedProducts.price;
            console.log("No offers applied");
        }
    } catch (error) {
        console.error('Error applying offer:', error);
    }
    console.log("success", sortedProducts);
    return sortedProducts;
};

const getShop = async (req, res) => {

    try {
        const userEmail = req.session.email
        const { sortBySelect, categoryId } = req.body;
        console.log(sortBySelect);
        console.log(categoryId);

        let sortedProducts;
        const user = await userdb.findOne({ email: userEmail })
        console.log('user', user);
        const category = await Categorydb.findById(categoryId)




        switch (sortBySelect) {
            case 'popularity':
                sortedProducts = await productdb.find({ category: category.id }).sort({ _id: 1 }).populate("category");
                break;
            case 'price-low-to-high':
                sortedProducts = await productdb.find({ category: category.id }).sort({ price: 1 }).populate("category");;
                break;
            case 'price-high-to-low':
                sortedProducts = await productdb.find({ category: category.id }).sort({ price: -1 }).populate("category");;
                break;
            case 'a-to-z':
                sortedProducts = await productdb.find({ category: category.id }).sort({ product_name: 1 }).populate("category");;
                break;
            case 'z-to-a':
                sortedProducts = await productdb.find({ category: category.id }).sort({ product_name: -1 }).populate("category");;
                break;
            case 'newest-first':
                sortedProducts = await productdb.find({ category: category.id }).sort({ _id: -1 }).populate("category");;
                break;
            default:
                sortedProducts = await productdb.find({ category: category.id }).populate("category");;
        }
        console.log("success", sortedProducts);
        for (const sortedProduct of sortedProducts) {
            await applyoffer(sortedProduct);
        }
        console.log("success", sortedProducts);
        res.json(sortedProducts)




    }

    catch (error) {

        // Handle error
        res.status(500).send("Internal Server Error");

    }


};




module.exports = { getShop };
















