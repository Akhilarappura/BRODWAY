const jwt = require('jsonwebtoken');
const userdb = require("../model/userModel")
const productdb = require("../model/productModel")

const checkBlocked = async (req, res, next) => {
  const products = await productdb.find().populate('category')
  if (req.session && req.session.email) {
    const email = req.session.email;
    await userdb.findOne({ email: email }).then((user) => {
      if (user && user.status === "active") {
        next();
      } else {

        delete req.session;
        res.clearCookie('userToken');

        res.render("index", { userToken: undefined, products });
      }
    });
  } else {
    delete req.session;

    res.render("index", { userToken: undefined, products });
  }
}

  const verifyAdmin = async (req, res, next) => {
    if (req.cookies && req.cookies.adminToken) {
      next();
    } else {
      console.log('clearing cookies');
      res.clearCookie('adminToken');
      res.redirect('/adminsignup')
    }
  
  }


const userLoggedIn = async (req, res, next) => {
  if (req.session.email && req.cookies.userToken) {
    next()
  } else {
    res.redirect('/login')
  }
}
module.exports={
  checkBlocked,verifyAdmin, userLoggedIn
}