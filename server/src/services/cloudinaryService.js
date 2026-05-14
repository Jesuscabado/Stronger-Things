import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Sube un buffer a Cloudinary. Para PDFs y similares se usa resource_type "raw".
 */
export const uploadToCloudinary = (buffer, originalname) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",      // 👈 IMPORTANTE
                folder: "strongerthings/character-sheets",
                use_filename: true,
                unique_filename: true,
                filename_override: originalname,
                format: "pdf"                // 👈 IMPORTANTE
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export const uploadImageToCloudinary = (buffer, characterName) => {
    return new Promise((resolve, reject) => {
        const sanitized = characterName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "strongerthings/avatars",
                public_id: `${sanitized}-${Date.now()}`,
                overwrite: true,
                transformation: [
                    { width: 500, height: 500, crop: "fill", gravity: "auto" },
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export const deleteImageFromCloudinary = (publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "image" });

export const deleteFromCloudinary = (publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" });