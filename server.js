const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const SignupModel = require("./Models/SignupModel.js");
const bcrypt = require('bcrypt');
const { Server } = require('socket.io'); 
const http = require('http');
const jwt = require("jsonwebtoken")  ; 
const nodemailer = require('nodemailer') ; 

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT_NUMBER = process.env.PORT || 8000;
const MONGOURL = process.env.MONGO_ATLAS_CONNECTION_URL;

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on("answerCall", (data) => io.to(data.to).emit("callAccepted", data.signal));
});

try {
    mongoose.connect(MONGOURL);
    console.log("MongoDb connected!");
} catch (err) {
    console.log("Connection error: " + err);
}

app.use(cors());
app.use(express.json());

app.post('/api/Signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await SignupModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newSignup = await SignupModel.create({ name, email, password: hashedPassword });

        console.log("New User Created", newSignup);
        return res.status(201).json({ message: "Success" });
    } catch (error) {
        console.log("Error Signing Up", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/api/Login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await SignupModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({ message: "Login successful" });

    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//nodemailer configuration
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'aditya.bhattacharjee706@gmail.com',
      pass: process.env.GOOGLE_APP_PASSWORD
    }
});
  
app.post('/api/ForgotPassword', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await SignupModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = jwt.sign({ id: user.id }, "jwt_secret_key", { expiresIn: "1d" });

        var mailOptions = {
            from: 'aditya.bhattacharjee706@gmail.com',
            to: email,
            subject: 'Link to Reset Password !',
            text: `http://localhost:3000/ResetPassword/${user.id}/${token}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Error sending email" });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ message: "Success" });
            }
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/api/ResetPassword/:id/:token', async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        jwt.verify(token, "jwt_secret_key", async (err, decoded) => {
            if (err) {
                return res.status(400).json({ message: "Error with token" });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                await SignupModel.findByIdAndUpdate(id, { password: hashedPassword });
                return res.status(200).json({ message: "Success" });
            }
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


server.listen(PORT_NUMBER, () => {
    console.log(`Server is running on Port Number ${PORT_NUMBER}`);
});
