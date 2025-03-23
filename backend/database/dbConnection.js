import mongoose from "mongoose";
import dotenv from "dotenv";


// Load environment variables from .env file
dotenv.config();


export const dbConnection = ()=>{
    mongoose
    .connect(
       process.env.MONGO_URI,
       {dbName: "SIMALEVENT_MESSAGE"})
    .then(()=>{
        console.log("connected to database")
    })
    .catch((err)=>{
        console.log("some error occured while connecting to batabase:", err);
    });
};
