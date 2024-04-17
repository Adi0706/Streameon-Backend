const mongoose = require('mongoose')


 const SignupSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
  
})

 const SignupModel = mongoose.model('Signups',SignupSchema) ;
module.exports = SignupModel ;