const express = require('express') ; 
const cors = require('cors')
const dotenv = require('dotenv') ; 


dotenv.config() ; 
const app = express() ; 
const PORT_NUMBER = process.env.PORT

app.use(cors()) ; 
app.use(express.json()) ; 

app.get('/',(req,res)=>{
    res.send("hi i am server")
})


app.listen(PORT_NUMBER,()=>{
    console.log(`server is running on Port Number  ${PORT_NUMBER}`) ; 
})