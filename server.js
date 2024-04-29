const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const SignupModel = require("./Models/SignupModel.js");
const bcrypt = require('bcrypt');
const {Server} = require('socket.io') ; 
const app = express();



dotenv.config();



const PORT_NUMBER = process.env.PORT;
const MONGOURL = process.env.MONGO_ATLAS_CONNECTION_URL;
// const SOCKET_PORT = process.env.SOCKET_PORT

const httpServer = require('http').createServer(app); // Create HTTP server to integrate it with Socket server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Socket.io server connection for video calls
io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    // Fix syntax for answerCall event handling
    socket.on("answerCall", (data) => io.to(data.to).emit("callAccepted", data.signal));
});






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




app.listen(PORT_NUMBER, () => {
    console.log(`Server is running on Port Number ${PORT_NUMBER}`);
});