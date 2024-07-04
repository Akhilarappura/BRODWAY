const userdb = require('../../model/userModel')
const Addressdb = require("../../model/addressModel")
const categorydb=require('../../model/categoryModel')
const cartdb=require('../../model/cartmodel')
const moment = require('moment')





const get_profile = async (req, res) => {
    try {

        const user = req.session.email;
        const detail = await userdb.findOne({ email: user })
        const address = await Addressdb.find({ user: detail._id })
        const Category = await categorydb.find();
        let cartCount = 0;
        const cart = await cartdb.findOne({ user: detail._id  });
        cartCount = cart ? cart.items.length : 0;

        res.render("userProfile", { detail, address, moment, user,Category,cartCount,cart, userToken: req.cookies.userToken})


    } catch (error) {
        console.log(error)
        res.redirect('/')

    }

}

const get_address = async (req, res) => {
    try {
        const user = req.session.email;
        console.log(user, "namne");
        const detail = await userdb.findOne({ email: user })
        const userdetail = await userdb.findOne({ email: user })
        const address = await Addressdb.find({ user: userdetail._id })
        const Category = await categorydb.find();
        let cartCount = 0;
        const cart = await cartdb.findOne({ user: detail._id  });
        cartCount = cart ? cart.items.length : 0;

        res.render("address", { address, userdetail, moment, detail,Category,cartCount, userToken: req.cookies.userToken })

    } catch (error) {
        console.log(error.message)
        res.status(400).render("error500")

    }
}


const get_addAddress = async (req, res) => {
    try {

        const userdetail = await userdb.findOne({ email: req.session.email })
        const address = await Addressdb.find({ user: userdetail._id })
        res.render("addAddress", { userdetail, address })

    } catch (error) {
        console.log(error.message);
        res.status(400).render("error500")

    }
}


const post_address = async (req, res) => {
    try {
        const user = await userdb.findOne({ email: req.session.email })
        const add = new Addressdb({
            user: user._id,
            name: req.body.name,
            mobileNumber: req.body.mobileNumber,
            pincode: req.body.pincode,
            locality: req.body.locality,
            address: req.body.address,
            district: req.body.district,
            state: req.body.state,
            country: req.body.country,




        })
        await add.save()
        res.redirect('/address')



    } catch (error) {

        console.log(error.message);
        res.status(400).render("error500")
    }
}



const addressdelete = async (req, res) => {
    try {


        const id = req.params.id;

        Addressdb.findByIdAndDelete(id)
            .then(data => {
                if (!data) {
                    res.status(404).send({ message: `Cannot delete address with ID: ${id}` });
                } else {
                    res.send({ message: "Address was deleted successfully" });
                }
            });

    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
}



const getEditAddress = async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.session.email;
        const address = await Addressdb.findById(id);
        const userdetail = await userdb.findOne({ email: req.session.email })
        const detail = await userdb.findOne({ email: user })
        res.render('editAddress', { address, userdetail, detail });
    } catch (error) {
        console.log(error.message);
        res.status(404).render('errorPage');
    }
};




const postEditAddress = async (req, res) => {
    try {

        const userdetail = await userdb.findOne({ email: req.session.email })
        const userid = userdetail._id;
        const addressId = req.params.id;

        const updateData = req.body;
        const updatedData = await Addressdb.findByIdAndUpdate(addressId, updateData, userdetail, { new: true })

        await updatedData.save()
        res.redirect('/address')



    } catch (error) {
        console.log(error.message);
        res.status(404).render('/address')

    }


}
const addProfilePicture = async (req, res) => {
    try {
        const userEmail = req.session.email

    
        const images = req.files;
        const newImage = images[0]
        console.log('newImage', newImage);
        //    console.log(images);
        //    const imagePath=images.map(image=>image.path)
        //    console.log('imagePath', imagePath);
        const updateProfilePic = await userdb.findOneAndUpdate({ email: userEmail }, { $set: { profilePicture: newImage.path } }, { new: true })

        res.redirect('/profile')


    } catch (error) {
        console.log(error);
        res.render('error500')

    }

}

//address_in checkout

const checkoutaddress = async (req, res) => {
    try {

        const user = await userdb.findOne({ email: req.session.email })
        const add = new Addressdb({
            user: user._id,
            name: req.body.name,
            mobileNumber: req.body.mobileNumber,
            pincode: req.body.pincode,
            locality: req.body.locality,
            address: req.body.address,
            district: req.body.district,
            state: req.body.state,
            country: req.body.country,




        })
        await add.save()
        res.redirect('/checkout')





    } catch (error) {
        console.log(error);
        res.status(400).render('error500')

    }

}

const getEditProfile = async (req, res) => {
    try {
        const user = req.session.email;
        const detail = await userdb.findOne({ email: user })
        const address = await Addressdb.find({ user: detail._id })

        res.render("editUserProfile", { detail, address, moment, message: '' })


    } catch (error) {
        console.log(error)
        res.redirect('/')

    }
}

const postEditProfile = async (req, res) => {
    try {
        const userdetail = await userdb.findOne({ email: req.session.email })
        const userId = req.params.id;

        const updatedData = req.body;
        const updateData = await userdb.findByIdAndUpdate(userId, updatedData, userdetail, { new: true })
        await updateData.save()
        res.redirect('/profile')

    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}








module.exports = {
    get_profile, get_address, post_address, get_addAddress, addressdelete, getEditAddress, postEditAddress, checkoutaddress,
    getEditProfile, postEditProfile, addProfilePicture
}
