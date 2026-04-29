import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectMongo } from "./config/db.js";
import baseObjectRoutes from "./routes/baseObjectRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
// Parser JSON
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", api: "StrongerThings - D&D 5e" });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/objects", baseObjectRoutes);
app.use("/api/characters", characterRoutes);

// Manejo de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Arranque
const start = async () => {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`🚀 StrongerThings API en marcha en http://localhost:${PORT}`);
    });
};

start();
