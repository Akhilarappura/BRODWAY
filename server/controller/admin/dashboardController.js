const orderdb = require('../../model/orderModel');
const productdb = require('../../model/productModel');
const categorydb = require('../../model/categoryModel');

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

        // Calculate total discount
        let totalDiscount = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.productId && item.productId.price != null) { // Check if productId is valid and has price
                    const productPrice = item.productId.price * item.quantity;
                    const discountedPrice = productPrice * (1 - (item.productId.discount / 100));
                    const discountAmount = productPrice - discountedPrice;
                    totalDiscount += discountAmount;
                }
            });
        });
        totalDiscount = Math.round(totalDiscount);
        console.log('totalDiscount', totalDiscount);

        const products = await productdb.find();
        const categories = await categorydb.find();

        const productCounts = products.map(product => ({
            productId: product._id,
            name: product.product_name,
            count: product.count,
            images: product.images,
            category: product.category,
            brand: product.brand
        }));

        // Sort products by count in descending order
        const sortedProductCounts = productCounts.sort((a, b) => b.count - a.count);

        // Calculate total sales for each brand
        const brandSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.productId && item.productId.brand) {
                    const brand = item.productId.brand;
                    if (!brandSales[brand]) {
                        brandSales[brand] = 0;
                    }
                    brandSales[brand] += item.quantity;
                }
            });
        });

        // Convert brandSales object to an array and sort it
        const sortedBrandSales = Object.keys(brandSales)
            .map(brand => ({ brand, count: brandSales[brand] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 brands

        // Calculate total sales for each category
        const categorySales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.productId && item.productId.category) {
                    const category = item.productId.category.toString();
                    if (!categorySales[category]) {
                        categorySales[category] = 0;
                    }
                    categorySales[category] += item.quantity;
                }
            });
        });

        // Convert categorySales object to an array and sort it
        const sortedCategorySales = Object.keys(categorySales)
            .map(categoryId => {
                const category = categories.find(c => c._id.toString() === categoryId);
                return {
                    categoryName: category ? category.categoryName : "Unknown",
                    count: categorySales[categoryId]
                };
            })
            .sort((a, b) => b.count - a.count);

        console.log('totalSales', totalSales);
        console.log('totalOrderAmount', totalOrderAmount);
        console.log('productCounts', productCounts);
        console.log('sortedProductCounts', sortedProductCounts);
        console.log('sortedCategorySales', sortedCategorySales);
        console.log('sortedBrandSales', sortedBrandSales);

        res.render('adminDashboard', {
            orders,
            totalSales,
            totalOrderAmount,
            productCounts,
            sortedProductCounts,
            sortedCategorySales,
            totalDiscount,
            sortedBrandSales
        });
    } catch (error) {
        console.log(error);
        res.redirect('/error500');
    }
};

module.exports = {
    admindash
};


