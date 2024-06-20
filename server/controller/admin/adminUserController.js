const express = require('express')
const userModel = require('../../model/userModel')
const userdb = require('../../model/userModel')
const moment = require('moment')





// allusers

const getUser = async (req, res) => {

    const allusers = await userModel.find()


    res.render('allusers', { allusers: allusers });
}


const user_delete = async (req, res) => {
    const id = req.params.id;
    console.log(id)

    userdb.deleteMany({ userdb: id })
        .then(() => {
            userdb.findByIdAndDelete(id)
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
}

const block = async (req, res) => {
    try {
        const blockId = req.query.id;
        const user = await userModel.findById(blockId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();
        res.redirect('/allusers');
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
}





module.exports = {
    getUser, user_delete, block
}
