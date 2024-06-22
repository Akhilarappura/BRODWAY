const orderdb=require('../../model/orderModel');
const productdb = require('../../model/productModel');



const admindash = async (req, res) => {
    try {
        const orders = await orderdb.find().populate('items.productId');
        console.log(orders, 'orders');

        const totalSales = orders.reduce((acc, order) => {
            order.items.forEach(item => {
                acc += item.quantity;
            });
            return acc;
        }, 0);

        const totalOrderAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);

        const products = await productdb.find();
        const productCounts = products.map(product => ({
            productId: product._id,
            name: product. product_name,  // assuming the product has a 'name' field
            count: product.count
        }));
           // Sort products by count in descending order
           const sortedProductCounts = productCounts.sort((a, b) => b.count - a.count);

        console.log('totalSales', totalSales);
        console.log('totalOrderAmount', totalOrderAmount);
        console.log('productCounts', productCounts);
        console.log('sortedProductCounts', sortedProductCounts);



        res.render('adminDashboard', { orders, totalSales, totalOrderAmount, productCounts,sortedProductCounts});
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
};


  





module.exports={
admindash
}