import express from "express";
import { connectMongo } from "./db/mongoose.js";

const app = express();


connectMongo();
app.listen(3000,()=>{
    console.log("app en marcha")
})