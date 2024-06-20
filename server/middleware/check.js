const jwt = require('jsonwebtoken');
const userdb = require("../model/userModel")
const productdb = require("../model/productModel")

exports.checkBlocked = async (req, res, next) => {
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

exports.verifyAdmin = async (req, res, next) => {
  if (req.cookies && req.cookies.adminToken) {
    next();
  } else {
    res.redirect('/adminsignup')
  }
}


exports.userLoggedIn = async (req, res, next) => {
  if (req.session.email && req.cookies.userToken) {
    next()
  } else {
    res.redirect('/login')
  }
}


