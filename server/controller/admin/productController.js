const categorydb = require('../../model/categoryModel');
const productdb = require('../../model/productModel');
const offerdb = require('../../model/offerModel')
const multer = require('multer')







const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    filefilter: (req, file, cb) => {
        if (file.mimetype.startswith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("only images are allowed"))
        }
    },
})



const list = async (req, res) => {
    try {

        const categories = await categorydb.find();
        let products = await productdb.find().populate('category')

        const offers = await offerdb.find().populate('product_name')

        // Apply offers and update final price in products
        products = products.map(pdt => {
            let offerApplied = false;
            let savedAmount = 0;
            let finalPrice = pdt.price;
            let discountPercentage = 0;

            offers.forEach(offer => {
                if (offer.product_name && offer.product_name._id.toString() === pdt._id.toString()) {
                    offerApplied = true;
                    savedAmount = offer.discount_Amount;
                    discountPercentage = offer.discount_Percentage;
                    finalPrice = pdt.price - offer.discount_Amount;

                    // Update product with offer details
                    pdt.offerApplied = true;
                    pdt.offerDetails = {
                        offerName: offer.offerName,
                        discountAmount: offer.discount_Amount,
                        discountPercentage: offer.discount_Percentage,
                    };
                    pdt.finalPrice = finalPrice;
                }
            });


            pdt.save();
            return pdt;
        });








        res.render('allproducts', { products, categories, offers });
    }


    catch (error) {
        console.log("error.message", error);
        res.status(500).render('error500')

    }
}


``

const createproduct = async (req, res) => {
    if (!req.body) {
        res.render('error500');
        return;
    }
    const { category } = req.body;

    if (!req.files || !Array.isArray(req.files)) {
        console.log("No files uploaded or files is not an array");
        return res.status(400).send("No files uploaded");
    }

    const images = req.files.map(file => file.path);
    const price = parseInt(req.body.price);

    const discount = parseInt(req.body.discount) || 0;

    if (isNaN(price) || isNaN(discount)) {
        res.render('error500')
        return;
    }



    const totalPrice = Math.round(price * (1 - discount / 100));
    try {
        const category = await categorydb.findById(req.body.category)

        if (!category) {
            res.status(404).send({ message: 'category not found' })
            return
        }



        //create product instance
        const product = new productdb({
            product_name: req.body.product_name,
            category: category._id,
            brand: req.body.brand,
            price: price,
            color: req.body.color,
            size: req.body.size,
            description: req.body.stat,
            discount: discount,
            stock: req.body.stock,
            images: images,
            total_price: totalPrice,


        })

        await product.save();
        res.redirect('/products')
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'hi' })

    }
};

const addproducts = async (req, res) => {


    try {

        const categories = await categorydb.find();
        res.render('addproducts', { categories });
    } catch (error) {

        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}








const pro_delete = async (req, res) => {
    try {

        const id = req.params.id;

        productdb.deleteMany({ productdb: id })
            .then(() => {
                productdb.findByIdAndDelete(id)
                    .then(data => {
                        if (!data) {
                            res.status(404).send({ message: `cannot delete with this id ${id}` })

                        } else {
                            res.send({ message: 'succesful' })
                        }
                    })
                    .catch(err => {
                        res.status(500).send({ message: 'could not delete this' })
                    })
            })
            .catch(err => {
                res.status(500).send({ message: 'could not delete this' })
            })
    } catch (error) {
        console.error(error)
        res.render('error500')
    }
}




const pro_edit = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
            const id = req.params.id;

            const category = await categorydb.find()
            const pro_get = await productdb.findById(id)


            res.render('editproduct', { pro_get: pro_get, category: category })
        } else {
            res.redirect('/adminsignup')
        }
    } catch (error) {
        console.error(error);
        res.redirect('/error500')
    }
}

const post_edit = async (req, res) => {

    try {
        const productId = req.params.id;
        const updateData = req.body;
        const images = req.files;

        const updatedproduct = await productdb.findByIdAndUpdate(productId, updateData, { new: true });
        if (images && images.length > 0) {
            updatedproduct.images = updatedproduct.images.concat(images.map(image => image.path));
        }

        await updatedproduct.save()

        res.redirect('/products')
    } catch (error) {
        console.error(error);
        res.render("error500")
    }
}



const block = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await productdb.findById(productId)

        product.list = product.list === 'listed' ? 'blocked' : 'listed';
        await product.save();

        res.redirect('/products')
    }
    catch (error) {
        console.error("error blocking/unblocking user", error)
    }
}


const deleteImage = async (req, res) => {
    console.log("delete keri");


    const { productId, imageIndex } = req.params;
    try {
        const product = await productdb.findById(productId)
        if (!productId) {
            return
        }
        product.images.splice(imageIndex, 1)
        await product.save();
        res.status(200).send('Image deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting the image: ' + error.message)
    }
}








module.exports = {
    list, addproducts, createproduct, pro_delete, pro_edit, post_edit, block, deleteImage
}



