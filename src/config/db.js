import mongoose from "mongoose";

const buildMongoUri = () => {
    const {
        MONGO_HOST,
        MONGO_PORT,
        MONGO_USER,
        MONGO_PASSWORD,
        MONGO_DB
    } = process.env;

    const user = encodeURIComponent(MONGO_USER);
    const password = encodeURIComponent(MONGO_PASSWORD);
    return `mongodb://${user}:${password}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
};

const connectMongo = async () => {
    const mongoUri = buildMongoUri();
    console.log(`🔌 Conectando a: ${mongoUri.replace(/:[^:@]+@/, ":***@")}`);
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ Conectado a MongoDB (${process.env.MONGO_DB}@${process.env.MONGO_HOST})`);
    } catch (error) {
        console.error("❌ Error de conexión:", error.message);
        throw error;
    }
};

export { connectMongo };