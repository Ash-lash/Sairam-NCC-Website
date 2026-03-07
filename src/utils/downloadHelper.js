/**
 * Universal Download Utility
 * Handles CORS by fetching the file and creating a blob.
 * 
 * @param {string} fileUrl - The URL of the file to download.
 * @param {string} fileName - The name to save the file as.
 */
export const downloadImage = async (fileUrl, fileName) => {
    if (!fileUrl) return;

    // 1. Sanitize Filename & Detect Extension
    const isPdf = fileUrl.toLowerCase().includes('.pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'));

    // Extract real extension from URL (ignoring tokens)
    let extension = 'bin';
    try {
        const urlWithoutParams = fileUrl.split('?')[0];
        extension = urlWithoutParams.split('.').pop().toLowerCase();
        if (extension.length > 4 || extension.includes('/')) {
            extension = isPdf ? 'pdf' : 'jpg';
        }
    } catch (e) {
        extension = isPdf ? 'pdf' : 'jpg';
    }

    const cleanFileName = fileName ? fileName.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_') : 'download';
    const finalFileName = fileName.includes('.') ? fileName : `${cleanFileName}.${extension}`;

    try {
        // 2. Standard Fetch Attempt with explicit CORS mode
        const response = await fetch(fileUrl, {
            method: 'GET',
            mode: 'cors', // Explicitly request CORS
            credentials: 'omit',
            cache: 'no-cache',
        });

        if (!response.ok) throw new Error('CORS or Network error');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = finalFileName;

        document.body.appendChild(link);
        link.click();

        // Extended delay for cleanup to ensure browser starts download
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 500);

    } catch (error) {
        console.warn("Direct download failed. Falling back to browser default behavior.", error);

        // FALLBACK: Open in a browser-native way
        // Note: Filename enforcement ('download' attribute) only works same-origin
        // For Google Storage, this will open the PDF/Image or download with default server name
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        // This attribute won't work cross-origin but doesn't hurt to keep
        link.setAttribute('download', finalFileName);

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 100);
    }
};
