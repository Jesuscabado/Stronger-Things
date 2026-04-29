import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// Carpeta donde se guardan los PDFs
const UPLOAD_DIR = path.resolve("uploads", "character-sheets");

// La creamos al cargar el módulo
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const id = crypto.randomUUID();
        const ext = path.extname(file.originalname) || ".pdf";
        cb(null, `${id}${ext}`);
    }
});

// Solo PDFs y máximo 5MB
const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten archivos PDF"), false);
    }
};

export const characterSheetUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const UPLOAD_PATH = UPLOAD_DIR;
