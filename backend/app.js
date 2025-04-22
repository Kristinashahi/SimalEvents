import express from "express";
import { dbConnection } from "./database/dbConnection.js";
import dotenv from "dotenv";
import messageRouter from "./router/messageRouter.js";
import cors from "cors";
import authRoutes from "./router/Auth.js";
import adminRoutes from "./router/admin.js";
import vendorsRoutes from "./router/vendor.js";
import userRoutes from "./router/users.js";
import serviceRoutes from "./router/Services.js";
import cookieParser from "cookie-parser";
import bookingRoutes from "./router/Bookings.js";


 
const app = express()


dotenv.config({path: "./config/config.env"});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: [process.env.FRONTEND_URL] ,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"] 
}))




//middlewares 
app.use(express.json());
app.use(cookieParser()); // Enable cookie handling
app.use(express.urlencoded({extended: true}));


// Routes
app.use("/api/v1/message", messageRouter);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/vendor", vendorsRoutes);
app.use("/users", userRoutes);
//app.use("/api/vendors", vendorRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);



//Test routes
app.get("/",(req,res)=>{
    res.send('test')
})



//Database Connection
dbConnection();

export default app;



