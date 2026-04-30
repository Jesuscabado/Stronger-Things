console.log("[upload.js] cargado. USE_DRIVE_STORAGE =", JSON.stringify(process.env.USE_DRIVE_STORAGE));
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const useDrive = process.env.USE_DRIVE_STORAGE === "true";

console.log(`📦 Storage mode: ${useDrive ? "drive" : "local"}`);

const UPLOAD_DIR = path.resolve("uploads", "character-sheets");
if (!useDrive) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const id = crypto.randomUUID();
        const ext = path.extname(file.originalname) || ".pdf";
        cb(null, `${id}${ext}`);
    }
});

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF"), false);
};

export const characterSheetUpload = multer({
    storage: useDrive ? multer.memoryStorage() : diskStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const UPLOAD_PATH = UPLOAD_DIR;
export const STORAGE_MODE = useDrive ? "drive" : "local";