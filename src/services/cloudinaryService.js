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
                resource_type: "raw",
                folder: "strongerthings/character-sheets",
                public_id: `${Date.now()}-${originalname.replace(/\.[^/.]+$/, "")}`,
                use_filename: true,
                unique_filename: true
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export const deleteFromCloudinary = (publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" });