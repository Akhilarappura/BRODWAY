const cartdb = require('../../model/cartmodel');
const productdb = require('../../model/productModel');
const userdb = require('../../model/userModel')
const Addressdb = require('../../model/addressModel')
const orderdb = require('../../model/orderModel')
const Razorpay = require('razorpay');
const coupondb = require('../../model/couponModel');
const walletdb = require('../../model/walletModel');
const categorydb = require('../../model/categoryModel')




const razorpay = new Razorpay({
    key_id: 'rzp_test_Yf4QX1fH3V3BDE',
    key_secret: 'H265FfTj4892G8z94yh4vSs3'
});





const get_checkout = async (req, res) => {
    try {
        const user = await userdb.findOne({ email: req.session.email });
        if (!user) {
            return res.status(404).render('error404');
        }

     
        const walet = await walletdb.findOne({ user: user._id }) || { balance: 0, transactions: [] };
        console.log('walet', walet);

        const detail = await userdb.findOne({ email: user.email });

        if (!detail) {
            return res.status(404).render('error404');
        }

        const Category = await categorydb.find();
        const address = await Addressdb.find({ user: detail._id });
        const total = await cartdb.findOne({ user: detail._id }).populate('items.productId');
        console.log('total',total);
        const today = new Date();
        const applicableCoupons = await coupondb.find({
            expireDate: { $gte: today },
            minPurchaseAmount: { $lte: total.totalAmount || 0 },
        }).sort({ expireDate: 1 });

        res.render("checkout", { detail, address, total, applicableCoupons, Category, userToken: req.cookies.userToken, walet });
    } catch (error) {
        console.error('Error in get_checkout:', error);
        res.status(500).render('error500');
    }
};


const validatestock = async (req, res) => {
    try {

        const allItems = req.body.allItems;
        console.log(allItems);

        const outOfStockItems = [];


        for (const item of allItems) {

            const productId = item.productId;



            const product = await productdb.findById(productId);


            if (!product) {

                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {

                outOfStockItems.push(productId);
            }
        }
        console.log(outOfStockItems.length, "length");


        res.status(200).json({ outOfStockItems });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }

};




const stockresult = async (req, res) => {
    try {
        console.log("Processing stock result...");
        const { data, paymentMethod, totalamount } = req.body;
        const { items, addressId } = data;
        console.log('data', data);
        console.log('paymentMethod', paymentMethod);
        console.log('totalamount', totalamount);


        const address = await Addressdb.findById(addressId);
        console.log(address, 'address');
        if (!address) {
            return res.status(401).json({ message: 'Address not found', status: 401 });
        }


        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = User._id;



        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            console.log('productId', productId);

            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            product.count += 1;

            await product.save();
            console.log('product', product);


            updatedProducts.push({
                productId: productId,
                price: totalamount,
                quantity: item.quantity,
            });
        }
        console.log('updatedProducts', updatedProducts);

        const totalAmount = updatedProducts.reduce((total, item) => total + item.price * item.quantity, 0);
        let finalAmount = totalAmount;
        // let discount
        //         if (discount && discount > 0) {
        //             console.log('discount',discount);

        //             finalAmount = totalAmount - discount;
        //         }
        if (totalAmount > 1000) {

            const order = new orderdb({
                userId: userId,
                items: updatedProducts,
                totalAmount: finalAmount,
                address: address,
                paymentMethod: paymentMethod
            });

            await order.save();
            console.log('order', order);

            await cartdb.findOneAndDelete({ user: userId });


            res.json({ message: 'order completed' })
        }


    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const onlinepayment = async (req, res) => {
    try {
        console.log("Processing stock result...");
        const { data, paymentMethod, total } = req.query;
        const parsedData = JSON.parse(data)
        console.log('data', data);
        const { items, addressId } = parsedData;

        console.log(parsedData, "daata");
        console.log(paymentMethod);


        const address = await Addressdb.findById(addressId);
        console.log(address);
        if (!address) {
            return res.status(401).json({ message: 'Address not found', status: 401 });
        }


        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = User._id;



        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;

            console.log('productId', productId);

            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            await product.save();

            updatedProducts.push({
                productId: productId,
                price: product.price,
                quantity: item.quantity,
            });
        }

        const totalAmount = updatedProducts.reduce((total, item) => total + item.price * item.quantity, 0);


        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: total,
            address: address,
            paymentMethod: paymentMethod,
            paymentStatus: "Completed",
            status: 'Shipped'
        });

        await order.save();

        await cartdb.findOneAndDelete({ user: userId });


        res.redirect('/thankyou')



    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }

}



const razorpayment = async (req, res) => {
    console.log("razor");

    try {
        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("name");
        const { totalamount } = req.body;
        console.log(totalamount);




        const order = await razorpay.orders.create({
            amount: totalamount * 100,
            currency: 'INR',
            payment_capture: 1
        });


        res.json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating Razorpay order' });
    }
};

const failurePayment = async (req, res) => {
    console.log("failure");
    try {
        const { data, amount } = req.body;
        const parsedData = data;
        const { items, addressId, paymentMethod } = parsedData;
        console.log('amount', amount);
        // const status= await orderdb.findOne({status})

        const userEmail = req.session.email;
        const user = await userdb.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = user.id;

        console.log(items, addressId, 'adddd');

        const address = await Addressdb.findById(addressId);
        if (!address) {
            return res.status(401).json({ message: 'Address not found' });
        }

        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            console.log('productId', productId);

            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            await product.save();

            updatedProducts.push({
                productId: productId,
                price: product.price,
                quantity: item.quantity,
            });
        }

        const totalAmount = updatedProducts.reduce((total, item) => total + item.price * item.quantity, 0);

        const order = new orderdb({
            userId: userId,
            items: updatedProducts,
            totalAmount: totalAmount,
            address: address,
            paymentMethod: paymentMethod,
            paymentStatus: "Pending",
            status: 'failed'
        });

        await order.save();

        await cartdb.findOneAndDelete({ user: userId });

        res.status(200).json({ message: 'Order saved successfully', order });
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
};




const failure = async (req, res) => {
    const { orderId } = req.body;
    console.log('orderId', orderId);

    try {

        const order = await orderdb.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Create a new Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalAmount * 100, // 
            currency: 'INR',
            payment_capture: 1
        });

        res.json({ success: true, order: razorpayOrder });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
    }
};

const paymentSucces = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        console.log(orderId, 'llllllll');
        const order = await orderdb.findById(orderId);
        order.status = 'Shipped';
        order.paymentStatus = 'Completed';
        await order.save();
        return res.redirect('/orderpage')


    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}



const applyCoupon = async (req, res) => {
    try {

        const { couponCode, userEmail, totalAmount } = req.body;
        console.log(req.body);
        console.log(couponCode, "COUPONCODE");
        console.log('totalAmount',totalAmount);
        

        const user = await userdb.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const cart = await cartdb.findOne({ user: user._id }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' })
        }


        const coupon = await coupondb.findOne({ couponcode: couponCode });

        console.log('coupon', coupon);
        if (!coupon || coupon.expireDate < new Date() || coupon.minPurchaseAmount > cart.totalAmount) {
            return res.status(400).json({ message: 'Invalid or expired coupon' })
        }
        console.log(totalAmount);
        console.log(coupon.discountPercentage, "percentage ");


        const discount = parseInt((totalAmount) * (coupon.discountPercentage)) / 100
        console.log(discount, "discount");
        const newTotalAmount = Math.round(parseInt(cart.totalAmount) - discount);
        console.log(newTotalAmount, discount, "oi");
        res.json({ newTotalAmount, discount });

    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}

//wallet 

const getWallet = async (req, res) => {
    try {

        const user = req.session.email;
       


        const detail = await userdb.findOne({ email: user })
        if (!detail) {
            return res.status(404).render('error404', { message: 'User not found' });
        }

        let walet = await walletdb.findOne({ user: detail._id });

        if (!walet) {
            walet = new walletdb({
                user: detail._id,
                transactions: []
            });
            await walet.save();
        }

         walet = await walletdb.findOne({ user: detail._id });
        walet.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const Category=await categorydb.find();
        let cartCount = 0;
        const cart = await cartdb.findOne({ user: detail._id  });
        cartCount = cart ? cart.items.length : 0;
        res.render("wallet", { detail, user, walet,Category,userToken:req.cookies.userToken ,cartCount,cart})


    } catch (error) {
        console.log(error);
        res.render('error500');
    }
};

const walletPayment = async (req, res) => {
    
    try {

        console.log("Processing stock result...");
        const { data, paymentMethod, totalamount, orderAmount } = req.body;
        const { items, addressId } = data;
        console.log('data', data);
        console.log('paymentMethod', paymentMethod);
        console.log('totalamount', totalamount);

        const address = await Addressdb.findById(addressId);
        console.log(address);
        if (!address) {
            return res.status(401).json({ message: 'Address not found', status: 401 });
        }


        const User = await userdb.findOne({ email: req.session.email });
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userId = User._id;

        const updatedWallet = await walletdb.findOneAndUpdate(
            { user: userId },
            {
                $inc: { balance: -orderAmount },
                $push: { transactions: { type: 'debit', amount: orderAmount, description: `debited from wallet` } }
            },
            { upsert: true, new: true }
        );

        const updatedProducts = [];
        for (const item of items) {
            const productId = item.productId;
            console.log('productId', productId);

            const product = await productdb.findById(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                continue;
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Product with ID ${productId} is out of stock` });
            }

            product.stock -= item.quantity;
            product.count += 1;

            await product.save();
            console.log('product', product);


            updatedProducts.push({
                productId: productId,
                price: totalamount,
                quantity: item.quantity,
            });
        }
        console.log('updatedProducts', updatedProducts);

        const totalAmount = updatedProducts.reduce((total, item) => total + item.price * item.quantity, 0);
        let finalAmount = totalAmount;


        await cartdb.findOneAndDelete({ user: userId });


        res.json({ message: 'order completed' })



    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};










module.exports = {
    get_checkout, validatestock, stockresult, razorpayment, onlinepayment, applyCoupon, getWallet, failure, walletPayment, failurePayment,
    paymentSucces
}

