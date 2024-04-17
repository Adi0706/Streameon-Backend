const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const SignupModel = require("./Models/SignupModel.js");
const bcrypt = require('bcrypt');


dotenv.config();

const app = express();
const PORT_NUMBER = process.env.PORT;
const MONGOURL = process.env.MONGO_ATLAS_CONNECTION_URL;

try {
    mongoose.connect(MONGOURL);
    console.log("MongoDb connected!");
} catch (err) {
    console.log("Connection error: " + err);
}

// Middlewares
app.use(cors());
app.use(express.json());



app.post('/api/Signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user with the same email already exists
        const existingUser = await SignupModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hashing the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10); // Generated a salted hash with a complexity factor of 10

        // Created a new user with the hashed password
        const newSignup = await SignupModel.create({ name, email, password: hashedPassword });
        console.log("New User Created", newSignup);

        // Sending success response to frontend 
        return res.status(201).json({ message: "Success" });
    } catch (error) {
        console.log("Error Signing Up", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/api/Login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find user by email
      const user = await SignupModel.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      // Compare provided password with stored hashed password
      const passwordsMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordsMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      // Passwords match - login successful
      return res.status(200).json({ message: "Login successful" });
  
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });



  app.get('/api/Users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId; // Extract the userId from the request parameters
      
      // Fetch the user's profile from the database based on the provided userId
      const profile = await SignupModel.findById(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Return the profile data
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
});

  

app.listen(PORT_NUMBER, () => {
    console.log(`Server is running on Port Number ${PORT_NUMBER}`);
});
