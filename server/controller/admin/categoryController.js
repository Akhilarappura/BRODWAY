const categorydb = require("../../model/categoryModel")
const productdb = require("../../model/productModel")



const list = async (req, res) => {

    try {
        const category = await categorydb.find()
        res.render('category', { category })
    } catch (error) {
        console.error(error);
        res.render('error500')
    }
}

const get_add = async (req, res) => {

    res.render('addcategory', { message: '' })
}


const add = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).render('addcategory', { message: 'Content cannot be empty' });
        }

        const { categoryName, description } = req.body;

        if (!categoryName || categoryName.trim() === '') {
            return res.status(400).render('addcategory', { message: 'Category name cannot be empty' });
        }

        const trimmedCategoryName = categoryName.trim();


        if (!/^[A-Za-z\s]+$/.test(trimmedCategoryName)) {
            return res.status(400).render('addcategory', { message: 'Category name should only contain letters and spaces' });
        }


        const existingCategory = await categorydb.findOne({
            categoryName: { $regex: new RegExp(`^${trimmedCategoryName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).render('addcategory', { message: 'Category already exists' });
        }


        const newCategory = new categorydb({
            categoryName: trimmedCategoryName,
            description: description ? description.trim() : ''
        });

        await newCategory.save();



        res.redirect('/category');

    } catch (err) {
        console.error(err);
        res.status(500).render('addcategory', { message: 'An error occurred while adding the category' });
    }
};


const getEdit = async (req, res) => {


    const id = req.params.id
    const get = await categorydb.findById(id)
    console.log(get);

    res.render('editCategory', { get, message: "" })
}


const postedit = async (req, res) => {


    try {

        const categoryId = req.params.id;
        const updateData = req.body;

        const get = await categorydb.findById(categoryId)
        const categorySame = await categorydb.findOne({ categoryName: updateData.categoryName })

        if (categorySame) {
            return res.render('editCategory', { get, message: "Category already exists" })
        }


        const updatedCategory = await categorydb.findByIdAndUpdate(categoryId, updateData, { new: true });

        await updatedCategory.save()


        res.redirect('/category')

    } catch (error) {
        console.error(error)
        res.redirect('/error500')

    }
}


const delet = (req, res) => {
    try {

        const id = req.params.id;
        productdb.deleteMany({ category: id })
            .then(() => {
                categorydb.findByIdAndDelete(id)
                    .then(data => {
                        if (!data) {
                            res.status(404).send({ message: `cannot delete this with id ${id}` })
                        } else {
                            res.send({ message: "category and associated products were succesfully deleted" })
                        }
                    })

                    .catch(err => {
                        res.status(500).send({ message: 'could not delete this category' })
                    })
            })
            .catch(err => {
                res.status(500).send({ message: "could not delete this products with this" })
            })

    } catch (error) {
        console.error(error)
        res.redirect('/error500')
    }
}


const block = async (req, res) => {

    try {
        const categoryId = req.query.id;

        const category = await categorydb.findById(categoryId)



        category.list = category.list === 'listed' ? 'unlisted' : 'listed'


        await category.save()

        res.redirect('/category')
    }
    catch (error) {
        console.error("error blocking/unblocking user", error)
    }

}

module.exports = {

    list, get_add, add, getEdit, postedit, block, delet

}






