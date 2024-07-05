
const cartdb = require("../../model/cartmodel");
const Categorydb = require("../../model/categoryModel");
const productdb = require("../../model/productModel");
const userdb = require("../../model/userModel");
const offerdb = require("../../model/offerModel");





//apply offer


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
            category_name: product.category._id,
            status: 'active'
        });

        product.originalPrice = product.price;

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

const get_cart = async (req, res) => {
    try {
        if (req.cookies.userToken) {
            const user = await userdb.findOne({ email: req.session.email });
            const userId = user._id;
            const Category = await Categorydb.find();
            const usercartdb = await cartdb.findOne({ user: userId }).populate('items.productId');
            console.log(usercartdb, "price");

            let totalAmount = 0;

            if (!usercartdb) {
                return res.render('cart', { user: null, Category, userToken: req.cookies.userToken, cartCount: 0 });
            } else {
                for (let item of usercartdb.items) {
                    const productWithOffer = await applyoffer(item.productId);
                    item.productId.offerPrice = productWithOffer.offerPrice;
                    item.productId.originalPrice = productWithOffer.originalPrice;
                    totalAmount += productWithOffer.offerPrice * item.quantity;
                }
                usercartdb.totalAmount = totalAmount;
                await usercartdb.save();
            }

            const cartCount = usercartdb.items.length;

            res.render('cart', { user: usercartdb, userToken: req.cookies.userToken, Category, cartCount: cartCount, totalAmount });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render("error500");
    }
};


console.log("hi14");
const addtocart = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await userdb.findOne({ email: req.session.email });


        let userCart = await cartdb.findOne({ user: user._id });

        if (!userCart) {
            userCart = new cartdb({
                user: user._id,
                items: [{ productId: productId, quantity: 1 }]
            });
        } else {
            const existingCartItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

            if (existingCartItemIndex !== -1) {
                res.redirect('/cart')
            } else {

                userCart.items.push({ productId: productId, quantity: 1 });
            }
        }


        await userCart.save();
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        res.status(500).render('error500');
    }
};



const deleteCartItem = async (req, res) => {
    try {

        const productId = req.params.id;
        const user = await userdb.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).render('error500');
        }
        const userCart = await cartdb.findOne({ user: user._id });


        if (!userCart) {
            return res.status(404).render('error500');
        }

        const itemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).render('error500');
        }


        userCart.items.splice(itemIndex, 1);


        await userCart.save();
        res.send('success');
    } catch (error) {
        console.error(error);
        res.status(500).send('error500');
    }
};





const quantity = async (req, res) => {
    try {
        const { qua, id } = req.body;

        const cart = await cartdb.findOne({ "items._id": id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(item => item._id.toString() === id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found in the cart' });
        }

        // Check if quantity exceeds stock
        if (qua > item.productId.stock) {
            return res.status(400).json({ error: 'Quantity exceeds available stock' });
        }

        // Check if quantity exceeds the limit of 5
        if (qua > 5) {
            return res.status(400).json({ error: 'Maximum quantity limit is 5' });
        }

        const result = await cartdb.findOneAndUpdate(
            {
                "items._id": id
            },
            {
                $set: { "items.$.quantity": qua }
            }
        );

        if (result) {
            res.status(200).json({ message: 'Quantity updated successfully' });
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};








module.exports = {
    get_cart, addtocart, deleteCartItem, quantity
}