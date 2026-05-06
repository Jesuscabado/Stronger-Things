import "./config/loadEnv.js";

import express from "express";
import cors from "cors";

import { connectMongo } from "./config/db.js";
// ...resto igual
import baseObjectRoutes from "./routes/baseObjectRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import spellRoutes from "./routes/spellRoutes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ status: "ok", api: "StrongerThings - D&D 5e" });
});

app.use("/api/auth", authRoutes);
app.use("/api/objects", baseObjectRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/spells", spellRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await connectMongo();
        app.listen(PORT, () => {
            console.log(`🚀 StrongerThings API en marcha en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("💥 No se pudo arrancar la app:", error.message);
        process.exit(1);
    }
};

start();