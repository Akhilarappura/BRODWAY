const express = require('express')
const route = express.Router();
const Controller = require('../controller/user/controller')
const signupController = require('../controller/user/signupController')
const productController = require('../controller/user/productsController')
const check = require("../middleware/check")
const cartController = require("../controller/user/cartController")
const profileController = require('../controller/user/profileController')
const checkoutController = require("../controller/user/checkoutController")
const ordercontroller = require('../controller/user/orderController')
const wishlistController = require('../controller/user/wishlistController')
const adminOrderController = require('../controller/admin/adminOrderController')
const userOrderController = require('../controller/user/userOrderController')
const priceFilterController = require('../controller/user/priceFilterController')
const invoicController = require('../controller/user/invoiceController')
const userroute = require('../controller/admin/adminController')
const multer = require('multer')
const path = require('path')





const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);

    }
});
const upload = multer({ storage: storage });




route.get('/', userroute.index);

route.get('/err', Controller.error);
route.get('/productCategory', Controller.category);
route.get('/about', Controller.about);
route.get('/contact', Controller.contact);



//signupController
route.post('/signup', signupController.signup);
route.get('/signup', signupController.getsignup);
route.get('/otp', signupController.otp);
route.get('/resend', signupController.resendotp)
route.post('/otp', signupController.verify);
route.get('/login', signupController.loginpage)
route.post('/login', signupController.post_login)
route.get('/userlogout', signupController.userlogout);
route.get('/forgot', signupController.forgot)
route.post('/postforgot', signupController.postforgot)
route.post('/forgototp', signupController.verifypostotp)
route.post('/confirmotp', signupController.confirmotp)
route.get('/error500', Controller.error)
route.get('/reset', signupController.getreset)
route.post('/reset', signupController.postreset)
route.post('/postreset', signupController.cnfirmreset)


//productDetail
route.get('/productdetail', productController.get_productDetail)




//cartcontrolls

route.get('/cart', check.userLoggedIn, cartController.get_cart)
route.get('/cart/:id', check.userLoggedIn, cartController.addtocart)
route.delete('/delete/:id', check.userLoggedIn, cartController.deleteCartItem)
route.post('/quantity', check.userLoggedIn, cartController.quantity)

//wishlistController

route.get('/wishlist', check.userLoggedIn, wishlistController.getWishlist)
route.get('/wishlist/:id', check.userLoggedIn, wishlistController.addtowishlist)
route.delete('/deleteWishlist/:id', check.userLoggedIn, wishlistController.deletewishlist)


//userOrderController
route.get('/cancelorder/:id', check.userLoggedIn, userOrderController.getCancelOrder)
route.post('/returnOrder/:id', check.userLoggedIn, userOrderController.postReturnOrder);
route.get('/viewsingleorder', check.userLoggedIn, userOrderController.singleOrder)


//profileControllers
route.get('/profile', check.userLoggedIn, profileController.get_profile)
route.get('/address', check.userLoggedIn, profileController.get_address)
route.post('/addAddress', check.userLoggedIn, profileController.post_address)
route.get('/addAddress', check.userLoggedIn, profileController.get_addAddress)
route.delete('/addressdelete/:id', profileController.addressdelete)
route.get('/editAddress/:id', check.userLoggedIn, profileController.getEditAddress)
route.post('/editAddress/:id', check.userLoggedIn, profileController.postEditAddress)
route.post('/checkoutaddress', profileController.checkoutaddress)
route.get('/editProfile', check.userLoggedIn, profileController.getEditProfile)
route.post('/editProfile/:id', check.userLoggedIn, profileController.postEditProfile)
route.post('/profileedit', check.userLoggedIn, upload.array('images'), profileController.addProfilePicture)



// //checkoutController
route.get('/checkout', check.userLoggedIn, checkoutController.get_checkout)
route.post('/verifyStock', check.userLoggedIn, checkoutController.validatestock)
route.post('/onlinepayment', check.userLoggedIn, checkoutController.onlinepayment)
route.post('/failurePayment', check.userLoggedIn, checkoutController.failurePayment)
route.post('/retryPayment', check.userLoggedIn, checkoutController.failure)
route.post('/paymentSucces', check.userLoggedIn, checkoutController.paymentSucces)
route.post('/stockresult', check.userLoggedIn, checkoutController.stockresult)
route.post('/razorpayment', check.userLoggedIn, checkoutController.razorpayment)
route.post('/applyCoupon', check.userLoggedIn, checkoutController.applyCoupon)
route.get('/wallet', check.userLoggedIn, checkoutController.getWallet)
route.post('/walletPayment', check.verifyAdmin, checkoutController.walletPayment)



//ordercontroller
route.get('/orderpage', check.userLoggedIn, ordercontroller.get_orderpage)
route.get('/thankyou', check.userLoggedIn, ordercontroller.complete)


// //adminController
route.get('/adminorder', adminOrderController.adminorder)
route.post('/orderStatus', adminOrderController.paymentStatus)
route.post('/orderDetail', adminOrderController.orderDetail)
route.post('/updateOrderStatus/:orderId', adminOrderController.updateOrderStatus)
route.get('/orderDetails', adminOrderController.orderDetail)

//profileFilterController
route.post('/priceFilter', priceFilterController.getShop)

//invoicController
route.get('/invoice', invoicController.generateOrderInvoice)

//error handling
route.all('*', (req, res, next) => {
    res.render('error500')
})












module.exports = route