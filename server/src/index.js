import "./config/loadEnv.js";

import express from "express";
import cors from "cors";

import { connectMongo } from "./config/db.js";

import baseObjectRoutes from "./routes/baseObjectRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import spellRoutes from "./routes/spellRoutes.js";
import monsterRoutes from "./routes/monsterRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import { errorHandler, notFoundHandler, requestLogger } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

const app = express();
const PORT = process.env.APP_PORT || 3000;

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map(o => o.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(requestLogger);  
app.get("/", (req, res) => {
    res.json({ status: "ok", api: "StrongerThings - D&D 5e" });
});

app.use("/api/auth", authRoutes);
app.use("/api/objects", baseObjectRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/spells", spellRoutes);
app.use("/api/monsters", monsterRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/sessions",  sessionRoutes);
app.use("/api/maps",      mapRoutes);
app.use("/api/admin",     adminRoutes);
   // Middleware global de errores

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await connectMongo();
        app.listen(PORT, () => {
            logger.info(`🚀 StrongerThings API en marcha en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("💥 No se pudo arrancar la app:", error.message);
        process.exit(1);
    }
};

start();