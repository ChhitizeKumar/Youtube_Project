// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from './db/index.js';
import { app } from "./app.js";
// import { uploadOnCloud } from "./utlis/Cloudinary.js";


dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {

    app.on("error", (error) =>{
        console.log("Error in App listening: ", error);
        throw error;
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is listening on port: ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("Mongodb connection faied: ", error);
});

