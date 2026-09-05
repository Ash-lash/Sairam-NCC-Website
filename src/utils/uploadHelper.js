import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import imageCompression from "browser-image-compression";

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

/**
 * Universal Firebase Upload Helper with Auto-Optimization:
 * - Automatically compresses images to crisp WebP format (max 1920px, ~100KB)
 * - Sets 1-year immutable Cache-Control headers on Firebase Storage
 * - Falls back cleanly if compression or direct upload encounters edge cases
 */
export const uploadFile = async (file, setMessage = () => { }) => {
    if (!file) return "";

    const isImage = file.type.startsWith("image/");
    const isSvg = file.type.includes("svg") || file.name?.toLowerCase().endsWith(".svg");
    const typeLabel = isImage ? "Photo" : "Document";

    let uploadPayload = file;
    let contentType = file.type || "application/octet-stream";
    let fileExt =
        file?.name?.split(".").pop()?.toLowerCase() ||
        file?.type?.split("/").pop()?.toLowerCase() ||
        (isImage ? "jpg" : "bin");

    if (isImage && !isSvg) {
        try {
            setMessage("Optimizing photo for instant loading...");
            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: "image/webp",
                initialQuality: 0.85
            };
            const compressed = await imageCompression(file, options);
            if (compressed && compressed.size < file.size) {
                uploadPayload = compressed;
                contentType = "image/webp";
                fileExt = "webp";
            }
        } catch (compressionErr) {
            console.warn("Client-side image compression bypassed:", compressionErr);
        }
    }

    setMessage(`Uploading ${typeLabel}...`);

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const folder = isImage ? "images" : "documents";
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const metadata = {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        contentDisposition: `inline; filename="${fileName}"`
    };

    try {
        const snapshot = await uploadBytes(storageRef, uploadPayload, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`${typeLabel} uploaded successfully:`, downloadURL);
        setMessage(`${typeLabel} uploaded!`);
        return downloadURL;
    } catch (err) {
        if (isImage) {
            try {
                const dataUrl = await readFileAsDataURL(uploadPayload);
                const snapshot = await uploadString(storageRef, dataUrl, "data_url", metadata);
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.warn("Direct image upload fallback succeeded.");
                setMessage(`${typeLabel} uploaded!`);
                return downloadURL;
            } catch (fallbackErr) {
                console.error("Firebase Upload Fallback Error:", fallbackErr);
                if (fallbackErr.serverResponse) console.error("Server Response:", fallbackErr.serverResponse);
                throw fallbackErr;
            }
        }

        console.error("Firebase Upload Error:", err);
        if (err.serverResponse) console.error("Server Response:", err.serverResponse);
        throw err;
    }
};