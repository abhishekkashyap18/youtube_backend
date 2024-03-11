import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
})



connectDB()
.then(()=>{
    //Todo : listen for errors
    app.listen(process.env.PORT , () => {
        console.log(`Server started on port ${process.env.PORT}`);
    })
})
.catch((err)=> {
    console.log("MONGO db connection failed!!",err);
});





/*
const app = express();

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", () => {
        console.log("ERR: ",error)
        throw error
       })

       app.listen(process.env.PORT, () => {
        console.log("ERROR: ", error);
       })

    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
})()
*/
