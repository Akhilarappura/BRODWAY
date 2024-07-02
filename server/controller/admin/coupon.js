const coupondb = require('../../model/couponModel');
const orderdb = require('../../model/orderModel');
const productdb = require('../../model/productModel');




const coupons = async (req, res) => {

    try {
        const coupon = await coupondb.find()
        res.render('adminCoupons', { coupon })
    } catch (error) {
        console.error(error);
        res.render('error500')
    }
}
const getaddcoupons = async (req, res) => {
    try {
        res.render('adminAddCoupon', { message: '' })


    } catch (error) {

        console.log(error);
        res.render('error500')
    }
}





const addCoupons = async (req, res) => {
    try {

        if (!req.body) {
            res.status(400).send({ message: 'Content cannot be empty' })
        }
        let coupons = await coupondb.findOne({ couponcode: req.body.couponcode });
        console.log('coupons', coupons);
        if (coupons) {
            return res.render('adminAddCoupon', { message: 'Coupon already exists' });
        } else {
            console.log(req.body.couponcode, "coupons");
            const newCoupon = new coupondb({
                couponcode: req.body.couponcode,
                maxDiscount: req.body.maxDiscount,
                expireDate: req.body.expireDate,
                minPurchaseAmount: req.body.minPurchaseAmount

            });
            // }
            console.log(newCoupon);
            await newCoupon.save();
            res.redirect('/coupon')
        }



    } catch (error) {
        console.log(error);
        res.render('error500')

    }
}




const deleteCoupon = async (req, res) => {
    console.log("keri");

    try {
        const id = req.params.id;
        console.log(id, "id");
        const coupon = await coupondb.findById(id);
        console.log(coupon, "oi");

        if (!coupon) {
            return res.status(404).send({ message: `Cannot delete coupon with id ${id}. Coupon not found.` });
        }

        await coupondb.findByIdAndDelete(id);
        res.json({ success: true, message: "Coupon was successfully deleted" });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Could not delete the coupon' });
    }
};




const geteditCoupon = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("Coupon ID:", id);

        const get = await coupondb.findById(id);
        console.log("Retrieved Coupon Data:", get);

        if (!get) {
            return res.status(404).send({ message: 'Coupon not found' });
        }

        res.render('editCoupon', { get, message: '' });
    } catch (error) {
        console.log(error);
        res.render('error500');
    }
};


const posteditCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updatedCoupon = req.body;


        if (!updatedCoupon.couponcode || !updatedCoupon.expireDate || !updatedCoupon.minPurchaseAmount || !updatedCoupon.discountPercentage) {
            return res.render('editCoupon', { get: updatedCoupon, message: 'All fields are required.' });
        }


        if (updatedCoupon.discountPercentage < 10 || updatedCoupon.discountPercentage > 70) {
            return res.render('editCoupon', { get: updatedCoupon, message: 'Discount percentage must be between 10 and 70.' });
        }

        const existingCoupon = await coupondb.findById(couponId);
        if (!existingCoupon) {
            return res.render('editCoupon', { get: updatedCoupon, message: 'Coupon not found.' });
        }

        const couponSame = await coupondb.findOne({ couponcode: updatedCoupon.couponcode });
        if (couponSame && couponSame._id.toString() !== couponId) {
            return res.render('editCoupon', { get: updatedCoupon, message: 'Coupon already exists.' });
        }

        await coupondb.findByIdAndUpdate(couponId, updatedCoupon, { new: true });



        res.redirect('/coupon');
    } catch (error) {
        console.error(error);
        res.render('error500');
    }
}








module.exports = {
    coupons, getaddcoupons, addCoupons, deleteCoupon, geteditCoupon, posteditCoupon
}