

const categorydb = require('../../model/categoryModel')
const orderdb = require('../../model/orderModel')
const userdb = require('../../model/userModel')
const Walletdb = require('../../model/walletModel')
const productdb = require('../../model/productModel')
const cartdb = require('../../model/cartmodel')

const singleOrder = async (req, res) => {
  try {
    if (req.session.email) {
      const id = req.query.id;
      const order = await orderdb.findById(id).populate('items.productId');
      const user = await userdb.findOne({ email: req.session.email });
      const userId = user._id;
      const products = await productdb.find().populate('category');
      const Category = await categorydb.find();
      const cart = await cartdb.findOne({ user: userId });
      let cartCount = cart ? cart.items.length : 0;

      console.log('Fetched order:', order);
      res.render('singleOrder', { order, user, products, Category, userToken: req.cookies.userToken, cartCount });
    }
  } catch (error) {
    console.log('Error fetching order:', error);
    res.render('error500');
  }
};






const getCancelOrder = async (req, res) => {
  try {
    console.log("im 1");

    const orderId = req.params.id;
    const reason = req.query.reason || "No reason provided";



    const userEmail = req.session.email
    console.log(userEmail, "user");
    const user = await userdb.findOne({ email: userEmail })
    const userId = user._id;
    console.log('userId', userId);

    const wallet = await Walletdb.findOne({ user: userId })
    const updateOrder = await orderdb.findByIdAndUpdate(orderId, {
      $set: { status: "Cancelled", cancellationReason: reason }
    }, { new: true }).populate("items.productId");

    if (!updateOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let totalRefund = 0;
    let updatedWallet;

    for (const item of updateOrder.items) {
      await productdb.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });

      const refundAmount = item.price * item.quantity;
      totalRefund += refundAmount;
      if (!wallet) {
        const wallett = new Walletdb({
          user: user,
          balance: refundAmount,
          transactions: { type: 'refund', amount: refundAmount, description: `Order Returned for item ${item.productname}` }

        })
        wallett.save()
      } else {

        updatedWallet = await Walletdb.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: refundAmount },
            $push: { transactions: { type: 'refund', amount: refundAmount, description: `Order cancelled for item ${item.productname}` } }
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      refundAmount: totalRefund,
      newBalance: updatedWallet ? updatedWallet.balance : 0
    });
  } catch (error) {
    console.error("Error in getCancelOrder:", error);
    res.status(500).json({ success: false, message: "Error occurred during cancel order", error: error.message });
  }
};



const postReturnOrder = async (req, res) => {
  try {

    const userEmail = req.session.email
    console.log(userEmail, "user");
    const user = await userdb.findOne({ email: userEmail })
    const userId = user._id;

    const orderId = req.params.id;
    console.log('orderId', orderId);

    const wallet = await Walletdb.findOne({ user: userId })



    const orderUpdate = await orderdb.findByIdAndUpdate(orderId, {
      $set: { status: "Return Requested" }
    }, { new: true }).populate("items.productId");

    if (!orderUpdate) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    let totalRefund = 0;
    let updatedWallet;
    for (const item of orderUpdate.items) {
      await productdb.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });

      const refundAmount = item.productId.price * item.quantity;
      totalRefund += refundAmount;

      console.log(totalRefund, "oi");
      if (!wallet) {
        const wallett = new Walletdb({
          user: user,
          balance: refundAmount,
          transactions: { type: 'refund', amount: refundAmount, description: `Order Returned for item ${item.productname}` }

        })
        wallett.save()
      } else {

        updatedWallet = await Walletdb.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: refundAmount },
            $push: { transactions: { type: 'refund', amount: refundAmount, description: `Order Returned for item ${item.productname}` } }
          },
          { upsert: true, new: true }
        );
      }


    }
    console.log(updatedWallet, "oioi");



    res.status(200).json({ success: true, message: "Order returned successfully" });
  } catch (error) {
    console.log("Error in postReturnOrder:", error);
    res.status(500).json({ success: false, message: "Error occurred during return order" });
  }
};












module.exports = {
  singleOrder, getCancelOrder, postReturnOrder
}