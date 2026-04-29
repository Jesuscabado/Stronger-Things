import mongoose from 'mongoose';
import dotenv from "dotenv";

dotenv.config();

const {
MONGO_HOST,
MONGO_USER,
MONGO_PASSWORD,
MONGO_DB
} = process.env;
const MONGO_PORT = 27017;
const buildMongoUri =()=>{
    const user = encodeURIComponent(MONGO_USER);
    const password = encodeURIComponent(MONGO_PASSWORD);
    return `mongodb://${user}:${password}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
}

const connectMongo = async()=>{

    try {
        const mongoUri = buildMongoUri();
        console.log(mongoUri)
        await mongoose.connect(mongoUri);
        console.log(`✅ Conectado a MongoDB (${MONGO_DB}@${MONGO_HOST})`);
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

export {connectMongo}