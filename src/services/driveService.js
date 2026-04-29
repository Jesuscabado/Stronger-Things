import { google } from "googleapis";
import { Readable } from "node:stream";

let driveClient = null;

const getDrive = () => {
    if (driveClient) return driveClient;

    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
        scopes: ["https://www.googleapis.com/auth/drive.file"]
    });
    driveClient = google.drive({ version: "v3", auth });
    return driveClient;
};

/**
 * Hace el archivo accesible para "cualquiera con el link".
 * Reader = solo lectura. No se indexa en Google ni aparece en búsquedas:
 * solo es accesible para quien tenga el link exacto.
 */
const makePublicByLink = async (drive, fileId) => {
    await drive.permissions.create({
        fileId,
        requestBody: {
            type: "anyone",
            role: "reader",
            allowFileDiscovery: false
        }
    });
};

/**
 * Sube un buffer a Google Drive y devuelve metadatos.
 * Si SHARE_PUBLIC_LINK está activo, también marca el archivo como visible por link.
 */
export const uploadToDrive = async ({ buffer, originalname, mimeType }) => {
    const drive = getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const sharePublicly = process.env.DRIVE_SHARE_PUBLIC === "true";

    const created = await drive.files.create({
        requestBody: {
            name: originalname,
            parents: folderId ? [folderId] : undefined
        },
        media: {
            mimeType,
            body: Readable.from(buffer)
        },
        fields: "id, name, size"
    });

    const fileId = created.data.id;

    // Hacer el archivo "anyone with link can view" si la flag está activa
    if (sharePublicly) {
        await makePublicByLink(drive, fileId);
    }

    // Recuperar el webViewLink DESPUÉS de aplicar permisos
    // (porque cambia según la visibilidad del archivo)
    const meta = await drive.files.get({
        fileId,
        fields: "id, name, size, webViewLink, webContentLink"
    });

    return {
        fileId: meta.data.id,
        name: meta.data.name,
        webViewLink: meta.data.webViewLink,         // abrir en visor de Drive
        webContentLink: meta.data.webContentLink,   // descarga directa (solo si es público)
        size: Number(meta.data.size) || buffer.length,
        public: sharePublicly
    };
};

/**
 * Descarga un archivo de Drive y lo escribe en la respuesta HTTP (stream).
 */
export const downloadFromDrive = async (fileId, res) => {
    const drive = getDrive();

    const meta = await drive.files.get({ fileId, fields: "name, mimeType" });
    res.setHeader("Content-Type", meta.data.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${meta.data.name}"`);

    const file = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
    );
    file.data.pipe(res);
};

export const deleteFromDrive = async (fileId) => {
    const drive = getDrive();
    await drive.files.delete({ fileId });
};