const express = require('express')
const morgan = require('morgan')
const bodyparser = require('body-parser')
const path = require('path')
const session = require('express-session')
const { v4: uuidv4 } = require('uuid')
const nocache = require('nocache')
const connectDB = require('./server/connection/connection')
const jwt = require('jsonwebtoken')
const passport = require('passport')
require('passport-google-oauth20').Strategy
require("./server/middleware/auth")
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const adminRouter = require('./server/routes/admin')
const userRouter = require('./server/routes/user')


connectDB()

const app = express();
dotenv.config({ path: '.env' })
const port = process.env.PORT || 3006


app.set('view engine', 'ejs')
app.use(express.json())
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());


app.use(nocache())
app.use(cookieParser())


//session create
app.use(session({
    secret: uuidv4(),
    cookie: { maxAge: 3600000 },
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/uploads', express.static('uploads'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.resolve(__dirname, "public/css")))
app.use('/images', express.static(path.resolve(__dirname, "public/images")))
app.use('/imagee', express.static(path.resolve(__dirname, "public/imagee")))
app.use('/js', express.static(path.resolve(__dirname, "public/js")))
app.use('/fonts', express.static(path.resolve(__dirname, "public/fonts")))

//auth google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

//callback for googlr authentication
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
        const userToken = req.user.userToken;
        const decodedToken = jwt.verify(userToken, 'your_secret_key');

        req.session.email = decodedToken.userId;
        res.cookie('userToken', userToken)
        res.redirect('/')
    })

app.use('/', adminRouter)
app.use('/', userRouter)







app.listen(port, () => {
    console.log(`server is running on http://localhost:3006 `);
})