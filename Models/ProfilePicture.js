const mongoose = require('mongoose') ; 


const ProfilePicSchema = new mongoose.Schema({
    image:String,
})

const ProfileImageModel = mongoose.model('ProfilePictures',ProfilePicSchema) ; 

module.exports=ProfileImageModel ; 