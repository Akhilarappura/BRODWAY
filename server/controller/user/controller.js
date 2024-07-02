const offerdb = require('../../model/offerModel')
const userModel = require('../../model/userModel')
const productdb = require('../../model/productModel')
const Categorydb = require('../../model/categoryModel')
const userdb = require('../../model/userModel')
const cartdb = require('../../model/cartmodel')
const wishlistdb = require('../../model/wishlistModel')






const error = async (req, res) => {
    res.render('error500')
}


const applyoffer = async (product) => {
    if (!product) {
        return null
    }

    const productOffer = await offerdb.findOne({ product_name: product._id, status: 'active' })
    const categoryOffer = await offerdb.findOne({ category_name: product.Category, status: 'active' });

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
const category = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const searchQuery = req.query.q;
        const userEmail = await userdb.findOne({ email: req.session.email });
        let products = await productdb.find({ category: categoryId }).populate('category');
        const wishlist = await wishlistdb.findOne({ user: userEmail });
        const Category = await Categorydb.find();

        // Apply search filter if search query exists
        if (searchQuery) {
            products = products.filter(product =>
                product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply offers to products
        for (const product of products) {
            await applyoffer(product);
        }

        if (req.cookies.userToken) {
            let cartCount;
            const user = await userdb.findOne({ email: req.session.email });
            const userId = user._id;
            let cart = await cartdb.findOne({ user: userId });
            cartCount = cart ? cart.items.length : 0;

            res.render('productList', {
                products,
                userToken: req.cookies.userToken,
                cartCount,
                user,
                Category,
                categoryId,
                wishlist,
                searchQuery: searchQuery || ''
            });
        } else {
            res.render('productList', {
                products,
                userToken: undefined,
                cartCount: 0,
                Category,
                wishlist,
                categoryId,
                searchQuery: searchQuery || ''
            });
        }
    } catch (error) {
        console.log(error);
        res.status(400).render('error500');
    }
};



const about = async (req, res) => {
    try {
        if (req.cookies.userToken) {
            let cartCount;
            const user = await userdb.findOne({ email: req.session.email })
            console.log(user);
            const userId = user._id
            const Category = await Categorydb.find()

            let cart = await cartdb.findOne({ user: userId })
            if (!cart) {
                cartCount = 0;
            }
            else {
                cartCount = cart.items.length
            }
            res.render('about', { userToken: req.cookies.userToken, cartCount: cartCount, user, Category })
        }
    } catch (error) {
        console.log(error);
        res.status(400).render('error500')
    }
}




const contact = async (req, res) => {
    try {
        if (req.cookies.userToken) {
            let cartCount;
            const user = await userdb.findOne({ email: req.session.email })
            console.log(user);
            const userId = user._id
            const Category = await Categorydb.find()


            let cart = await cartdb.findOne({ user: userId })
            if (!cart) {
                cartCount = 0;
            }
            else {
                cartCount = cart.items.length
            }
            res.render('contact', { userToken: req.cookies.userToken, cartCount: cartCount, user, Category })
        }

    } catch (error) {
        console.log(error);
        res.status(400).render('error500')
    }
}






// allusers

const getUser = async (req, res) => {

    const allusers = await userModel.find()


    res.render('allusers', { allusers: allusers });
}


const user_delete = async (req, res) => {
    const id = req.params.id;
    console.log(id)

    userdb.deleteMany({ userdb: id })
        .then(() => {
            userdb.findByIdAndDelete(id)
                .then(data => {
                    if (!data) {
                        res.status(404).send({ message: `cannot delete with this id ${id}` })

                    } else {
                        res.send({ message: 'succesful' })
                    }
                })
                .catch(err => {
                    res.status(500).send({ message: 'could not delete this' })
                })
        })
        .catch(err => {
            res.status(500).send({ message: 'could not delete this' })
        })
}

const block = async (req, res) => {
    try {
        const blockId = req.query.id;
        const user = await userModel.findById(blockId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        res.redirect('/allusers');
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
}





module.exports = {
    error, category, about, contact, getUser, user_delete, block
}
