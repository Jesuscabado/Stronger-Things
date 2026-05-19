import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const upload = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        stream.end(buffer);
    });

// ─── Personajes ──────────────────────────────────────────────────────────────

export const uploadCharacterAvatar = (buffer, characterId) =>
    upload(buffer, {
        resource_type: "image",
        folder: `strongerthings/characters/${characterId}`,
        public_id: "avatar",
        overwrite: true,
        transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "auto" },
            { quality: "auto", fetch_format: "auto" }
        ]
    });

export const uploadCharacterSheet = (buffer, characterId, filename) =>
    upload(buffer, {
        resource_type: "image",
        folder: `strongerthings/characters/${characterId}`,
        public_id: "sheet",
        overwrite: true,
        use_filename: false,
        filename_override: filename,
        format: "pdf"
    });

// ─── Monstruos ───────────────────────────────────────────────────────────────

export const uploadMonsterImage = (buffer, monsterId) =>
    upload(buffer, {
        resource_type: "image",
        folder: `strongerthings/monsters/${monsterId}`,
        public_id: "image",
        overwrite: true,
        transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto", fetch_format: "auto" }
        ]
    });

// ─── Eliminación ─────────────────────────────────────────────────────────────

export const deleteFromCloudinary = (publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

export const deleteImageFromCloudinary = (publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "image" });

// ─── Aliases para compatibilidad con código existente ────────────────────────

/** @deprecated Usar uploadCharacterSheet */
export const uploadToCloudinary = uploadCharacterSheet;

/** @deprecated Usar uploadCharacterAvatar o uploadMonsterImage */
export const uploadImageToCloudinary = uploadCharacterAvatar;
