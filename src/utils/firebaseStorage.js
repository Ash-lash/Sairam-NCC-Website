import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';
import imageCompression from 'browser-image-compression';

const sanitizeFileName = (fileName) => fileName.replace(/\s+/g, '_');

export const uploadFileToFirebaseStorage = async (file, folderPath) => {
    if (!file) return '';

    let fileToUpload = file;

    // Apply compression only for image files
    if (file.type && file.type.startsWith('image/')) {
        try {
            const options = {
                maxSizeMB: 0.4, // 400KB target
                maxWidthOrHeight: 1600,
                useWebWorker: true,
                initialQuality: 0.7,
            };
            console.log(`Compressing image: ${file.name} (original size: ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            fileToUpload = await imageCompression(file, options);
            console.log(`Compression complete. New size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.error('Image compression failed, uploading original:', error);
            fileToUpload = file;
        }
    }

    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const fullPath = `${folderPath}/${timestamp}_${safeName}`;
    const fileRef = ref(storage, fullPath);

    await uploadBytes(fileRef, fileToUpload, {
        contentType: fileToUpload.type || undefined,
        cacheControl: 'public, max-age=31536000, immutable',
    });

    return getDownloadURL(fileRef);
};

export const deleteFileFromFirebaseStorage = async (fileUrl) => {
    if (!fileUrl) return;
    // Note: Implementation for extracting path from URL can be complex.
    // We'll leave this as a placeholder or handle it if needed.
    console.log('Delete requested for:', fileUrl);
};
