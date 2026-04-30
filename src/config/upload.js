import multer from "multer";

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF"), false);
};

export const characterSheetUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});