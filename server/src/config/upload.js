import multer from "multer";

const pdfFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF"), false);
};

const imageFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP, GIF)"), false);
};

export const characterSheetUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: pdfFilter,
    limits: { fileSize: 50 * 1024 * 1024 }   // 50MB
});

export const avatarUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: 50 * 1024 * 1024 }    // 5MB es de sobra para un avatar
});