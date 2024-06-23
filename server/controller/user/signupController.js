const userModel = require('../../model/userModel')
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const express = require('express')
const userdb = require("../../model/userModel")
const bcrypt = require('bcrypt')


const otp = async (req, res) => {
  res.render('otp')
}



//create a nodemailer transporter for sending OTP emails

const createTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user:' akhilarappura1989@gmail.com',
    pass: 'qkqz fplr sdiv ifvz',
  },
});


// Generate a random 5-digit OTP

function generateOTP() {
  const length = 5;
  const digits = '0123456789';

  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits.charAt(randomIndex)
  }
  return otp
}



const getsignup = async (req, res) => {
  try {
    if (req.cookies.userToken) {
      res.redirect('/')
    } else {

      res.render('signup', { message: '' })
    }
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}



const signup = async (req, res) => {
  try {
    if (req.cookies.userToken) {
      res.redirect('/')
    } else if (req.session.otp) {
      delete req.session.otp;
      res.render('signup', { message: req.query.message || '' })
    }


    //validate reqiest

    const existingUser = await userModel.findOne({ email: req.body.email });

    req.session.Nname = req.body.name;
    req.session.Eemail = req.body.email;
    req.session.Ppass = req.body.password;


    if (existingUser) {
      res.render('signup', { message: 'Email already exists' })
    }
    else {

      const recipientEmail = req.body.email;
      const otp = generateOTP();
      req.session.otp = otp;

      console.log(recipientEmail, "email");
      console.log(otp, "otp");


      createTransporter.sendMail({
        from: 'akhilarappura1989@gmail.com',
        to: recipientEmail,
        subject: 'Your OTP for verification',
        text: `Your OTP is : ${otp}`,

      }, (error, info) => {
        if (error) {
          console.error('Error sending email', error);
          res.render('signup', { message: 'Error sending OTP via email', error: '' })
        } else {
          console.log('OTP sent Succesfully', info.response);


          res.render('otp', { email: req.body.email, message: "", error: '' });

        }
      })
    }


  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}

const resendotp = async (req, res) => {
  try {

    const recipientEmail = req.session.Eemail || req.session.email


    const otp = generateOTP();
    req.session.otp = otp;


    createTransporter.sendMail({
      from: 'akhilarappura1989@gmail.com',
      to: recipientEmail,
      subject: `Your OTP for Verification`,
      text: `Your new OTP is ${otp}`,

    }, (error, info) => {
      if (error) {
        console.error('Error sending email:', error)
        res.status(500).send('Error sending OTP via email');
      } else {
        console.log(`OTP resent succesfully:`, info.response)
        console.log(otp)
        res.render('otp', { email: recipientEmail, error: 'OTP resent succesfully', message: '' })
      }
    })

  } catch (error) {
    console.error('Error resending OTP', error)
    res.status(500).send('Error resending OTP', { message: 'ERROR OCCURED' })

  }
}







const verify = async (req, res) => {
  try {
    console.log(req.session.Ppass, req.session.Eemail);

    if (req.session.otp && req.body.otp == req.session.otp) {


      req.session.email = req.session.Eemail

      const hashedPassword = await bcrypt.hash(req.session.Ppass, 10)

      const user = new userdb({
        name: req.session.Nname,
        email: req.session.Eemail,
        password: hashedPassword
      });
      delete req.session.otp;

      await user.save();
      const userToken = jwt.sign(
        { email: req.session.Eemail }, 'your_key', { expiresIn: '1h' }
      );
      res.cookie('userToken', userToken);
      res.redirect('/')
    } else {
      res.status(400).render('otp', { message: 'OTP is not matching', error: '' });
    }
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}




//login
const loginpage = async (req, res) => {
  try {
    if (req.cookies.userToken) {
      res.redirect('/')
    } else
      res.render('login', { message: "" })
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}



const post_login = async (req, res) => {


  try {


    const email = req.body.email;
    const password = req.body.password;
    const user = await userdb.findOne({ email: email });
    console.log(req.session.Ppass);


    if (!user) {

      return res.render('login', { message: "incorrect email" })

    }
    if (user.status == 'blocked') {

      return res.render('login', { message: "User is blocked" })

    }
    const comparedPassword = await bcrypt.compare(password, user.password)
    console.log(comparedPassword);

    if (!comparedPassword) {

      return res.status(404).render('login', { message: 'incorrect password' })
    }

    const userToken = jwt.sign(
      { email: req.body.email }, 'your_key', { expiresIn: '1h' }
    );
    req.session.email = req.body.email;
    res.cookie('userToken', userToken);
    res.redirect('/')

  } catch (error) {
    console.log(error)
    res.redirect("/error500")

  }
}



const userlogout = async (req, res) => {
  try {

    req.session.email = null
    res.clearCookie('userToken');
    res.redirect('/')
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }

}



//fogotpassword

const forgot = async (req, res) => {
  res.render('forgotPassword')
}

const postforgot = async (req, res) => {
  try {

    const email = req.body.email;
    const user = await userdb.findOne({ email: email });
    if (!user) {

      return res.status(400).render('login', { message: "email doesnot exist" })
    }
    else {

      const recipientEmail = req.body.email
      req.session.forgotemail = email;


      const otp = generateOTP();
      req.session.otp = otp;


      createTransporter.sendMail({
        from: 'akhilarappura1989@gmail.com',
        to: recipientEmail,
        subject: `Your OTP for Verification`,
        text: `Your new OTP is ${otp}`,

      }, (error, info) => {
        if (error) {
          console.error('Error sending email:', error)
          res.status(500).send('Error sending OTP via email');
        } else {
          console.log(`OTP resent succesfully:`, info.response)
          console.log(otp)
          res.render('forgototp', { email: recipientEmail, error: 'OTP resent succesfully', message: '' })
        }
      })


    }
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}


const verifypostotp = async (req, res) => {
  try {

    if (req.body.otp == req.session.otp) {

      res.render('postforgot')

    } else {
      res.status(400).render('forgototp', { message: 'OTP is not matching', error: '' });
    }

  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}

const confirmotp = async (req, res) => {
  try {

    const password = req.body.password;

    const cpassword = req.body.cpassword;

    if (password === cpassword) {

      const user = await userdb.findOne({ email: req.session.forgotemail });


      user.hashedPassword = password;


      await user.save()
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}




//resetPassword


const getreset = async (req, res) => {
  if (req.cookies.userToken) {
    const message = req.query.error
    res.render('resetpassword', { message })
  }
}

const postreset = async (req, res) => {

  try {
    if (req.cookies.userToken) {
      const user = await userdb.findOne({ email: req.session.email });
      const oldpassword = user.password;
      const latestPassword = req.body.password

      const comparedPassword = await bcrypt.compare(latestPassword, oldpassword)

      console.log(comparedPassword);
      if (!comparedPassword) {
        const message = 'Old password is incorrect'
        return res.redirect(`/reset?error=message${encodeURIComponent(message)}`)
      }
      res.render('postreset')

    }
  } catch (error) {
    console.log(error);
    res.status(400).render('error500')
  }
}



const cnfirmreset = async (req, res) => {
  try {
    if (req.cookies.userToken) {
      const password = req.body.password;
      const cpassword = req.body.cpassword;

      if (password == cpassword) {

        const hashedPassword = await bcrypt.hash(password, 10)
        await userdb.findOneAndUpdate({ email: req.session.email }, { $set: { password: hashedPassword } })



        res.redirect('/profile')
      } else {
        return res.render('postreset')

      }
    }

  } catch (error) {
    console.log(error);
    res.status(400).render('error500')

  }
}






module.exports = {
  otp, getsignup, signup, resendotp, verify, userlogout, loginpage, post_login, forgot, postforgot, verifypostotp, confirmotp,
  getreset, postreset, cnfirmreset

}