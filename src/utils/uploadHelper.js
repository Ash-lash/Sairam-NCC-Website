import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

/**
 * Universal Firebase Upload Helper
 * - Preserves original image quality and file type
 * - Uses uploadBytes by default (faster + less memory)
 * - Falls back to Base64 upload for rare image edge cases
 */
export const uploadFile = async (file, setMessage = () => { }) => {
    if (!file) return "";

    const isImage = file.type.startsWith("image/");
    const typeLabel = isImage ? "Photo" : "Document";

    setMessage(`Uploading ${typeLabel}...`);

    const fileExt =
        file?.name?.split(".").pop()?.toLowerCase() ||
        file?.type?.split("/").pop()?.toLowerCase() ||
        (isImage ? "jpg" : "bin");

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const folder = isImage ? "images" : "documents";
    const storageRef = ref(storage, `${folder}/${fileName}`);

    try {
        const snapshot = await uploadBytes(
            storageRef,
            file,
            file.type ? { contentType: file.type } : undefined
        );
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`${typeLabel} uploaded successfully:`, downloadURL);
        setMessage(`${typeLabel} uploaded!`);
        return downloadURL;
    } catch (err) {
        if (isImage) {
            try {
                const dataUrl = await readFileAsDataURL(file);
                const snapshot = await uploadString(storageRef, dataUrl, "data_url");
                const downloadURL = await getDownloadURL(snapshot.ref);
                console.warn("Direct image upload failed. Fallback strategy used.", err);
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