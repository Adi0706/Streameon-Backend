const mongoose = require('mongoose') ; 


const UserSchema = new mongoose.Schema({
    userName:String,
    image:String,
})

const UserModel = mongoose.model('Users',UserSchema) ; 

module.exports=UserModel ; 