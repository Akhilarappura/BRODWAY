const express = require('express');
const productdb = require('../../model/productModel');
const orderdb = require('../../model/orderModel');
const moment = require('moment');

const adminorder = async (req, res) => {
    const orders = (await orderdb.find().populate('items.productId').populate('userId').sort({ _id: -1 }).exec());
    res.render('adminorder', { orders, moment });
};

const orderDetail = async (req, res) => {

    try {
        const orderId = req.query.id
        const order = await orderdb.findById(orderId).populate('items.productId')
        console.log('order', order.items);
        res.render('adminOrderDetail', { order })

    } catch (error) {
        console.log(error);
        res.redirect('/error500')

    }
}






const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.status;
        const newPaymentStatus = req.body.paymentStatus;

        const updatedOrder = await orderdb.findByIdAndUpdate(orderId, { status: newStatus, paymentStatus: newPaymentStatus }, { new: true });
        const order = await orderdb.findById(orderId);
        console.log(order);

        for (const item of order.items) {
            const product = await productdb.findById(item.productId);

            if (product) {
                product.stock += item.quantity;
                await product.save();
            } else {
                console.log(`Product with ID ${item.productId} not found`);
            }
        }

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};

const paymentStatus = async (req, res) => {
    try {
        const orderId = req.query.id;
        const order = await orderdb.findById(orderId);
        order.status = req.body.status;
        if (order.status === 'successful') {
            order.paymentStatus = 'completed';
        }
        await order.save();
        res.redirect('/adminorder');
    } catch (error) {
        console.log(error);
        res.status(404).render('error500');
    }
};








module.exports = {
    adminorder,
    paymentStatus,
    orderDetail,
    updateOrderStatus
};
