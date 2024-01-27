import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
// app.use(cors())

//app.use => to set configuration and middlewares
app.use(express.json({
    limit: "16kb", //limit incoming json limit to 16KB
})) 

//jo url ka data aa rha h uska encoding karne ke liye
//Like space jo url mein aa rha h uska encoding karna(%20, +) ye options h
//ye express ko batana parta h ki isko configure karo
//ish configuration ke liye express.urlencoded() use karta h express
app.use(express.urlencoded({
    extended: true, //(optional) used for nested object 
    limit: "16kb" //limit incoming json limit to 16
}))


//static config => if we want to store any files, pdfs, fevicons
//                 in our server
app.use(express.static("public"))

//cookieParser() => to perform CRUD opperations on borwer cookies of user
// meaning to set and access cookies of user
app.use(cookieParser());


//Routes import
import userRouter from './routes/user.routes.js';
import videoRouter from "./routes/video.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

export {app}