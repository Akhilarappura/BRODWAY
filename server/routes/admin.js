const express = require('express')
const route = express.Router();
const adminController = require('../controller/admin/adminController')
const adminOrderController = require('../controller/admin/adminOrderController')
const categoryController = require('../controller/admin/categoryController')
const productController = require('../controller/admin/productController')
const adminUserController = require('../controller/admin/adminUserController')
const salesReportController = require('../controller/admin/salesController')
const offerController = require('../controller/admin/offerController')
const coupon = require('../controller/admin/coupon')
const dashboardController = require('../controller/admin/dashboardController')
const check = require('../middleware/check')
const multer = require('multer')
const path = require('path')




//multer


const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);

    }
});
const upload = multer({ storage: storage });




//adminController

route.get('/adminlogout', adminController.adm_logout);
route.get('/adminsignup', adminController.adminlog);
route.post('/adminsignup', adminController.adminsign);





//adminOrderController
route.get('/adminorder', check.verifyAdmin, adminOrderController.adminorder)
route.post('/orderStatus', check.verifyAdmin, adminOrderController.paymentStatus)
route.post('/orderDetails', check.verifyAdmin, adminOrderController.orderDetail)





//category
route.get('/category', check.verifyAdmin, categoryController.list);
route.get('/addcategory', check.verifyAdmin, categoryController.get_add);
route.post('/addcategory', check.verifyAdmin, categoryController.add)
route.get('/delete/:id', check.verifyAdmin, categoryController.delet)
route.delete('/category-delete/:id', check.verifyAdmin, categoryController.delet)
route.get('/list', check.verifyAdmin, categoryController.block)
route.get('/edit/:id', check.verifyAdmin, categoryController.getEdit)
route.post('/edit/:id', check.verifyAdmin, categoryController.postedit)


//products
route.get('/products', check.verifyAdmin, productController.list)
route.get('/productedit/:id', check.verifyAdmin, productController.pro_edit);
route.post('/productedit/:id', check.verifyAdmin, upload.array('images', 4), productController.post_edit)
route.get('/addproduct', check.verifyAdmin, productController.addproducts)
route.post('/multproduct', check.verifyAdmin, upload.array('images', 4), productController.createproduct)
route.get('/deletepro/:id', check.verifyAdmin, productController.pro_delete)
route.delete('/product-delete/:id', check.verifyAdmin, productController.pro_delete)
route.get('/productlist', check.verifyAdmin, productController.block)
route.delete('/delete-image/:productId/:imageIndex', productController.deleteImage)


//users in adminside
route.get('/allusers', check.verifyAdmin, adminUserController.getUser)
route.get('/blockuser', check.verifyAdmin, adminUserController.block)


//coupons
route.get('/coupon', check.verifyAdmin, coupon.coupons)
route.get('/addcoupons', check.verifyAdmin, coupon.getaddcoupons)
route.post('/addcoupons', check.verifyAdmin, coupon.addCoupons)
route.delete('/couponDelete/:id', check.verifyAdmin, coupon.deleteCoupon)
route.get('/editCoupon/:id', check.verifyAdmin, coupon.geteditCoupon)
route.post('/editCoupon/:id', check.verifyAdmin, coupon.posteditCoupon)


//salesController
route.get('/getSalesReport', check.verifyAdmin, salesReportController.getSalesReport)
route.get('/salesReport', check.verifyAdmin, salesReportController.generateReport);
route.get('/generateReport', salesReportController.modalgenerateReport)
//chart
route.get('/dailyChart', check.verifyAdmin, salesReportController.dailyChart)
route.get('/monthlyChart', check.verifyAdmin, salesReportController.monthlySales)
route.get('/yearlyChart', check.verifyAdmin, salesReportController.yearlySales)

//offerController
route.get('/offer', check.verifyAdmin, offerController.getOffer)
route.get('/addOffer', check.verifyAdmin, offerController.getAddOffer)
route.post('/addOffer', check.verifyAdmin, offerController.postAddOffer)
route.get('/editoffer/:id',check.verifyAdmin,offerController.editOffer)

route.get('/offerlist', offerController.unlistOffer);

//dashboard
route.get('/admin', check.verifyAdmin, dashboardController.admindash)








module.exports = route