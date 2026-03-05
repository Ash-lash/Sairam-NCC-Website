/**
 * Utility to download an image from a URL.
 * Handles CORS by fetching the image and creating a blob.
 * 
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} fileName - The name to save the file as.
 */
export const downloadImage = async (imageUrl, fileName) => {
    if (!imageUrl) return;

    try {
        const response = await fetch(imageUrl, {
            method: 'GET',
            cache: 'no-cache',
            referrerPolicy: 'no-referrer',
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Try to extract extension from URL if not provided in fileName
        const extension = imageUrl.split('.').pop().split(/\#|\?/)[0] || 'jpg';
        const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${extension}`;

        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download image directly:", error);

        // Final attempt: Use a proxy to bypass CORS
        try {
            const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&dl=1`;
            const proxyResponse = await fetch(proxyUrl);
            if (proxyResponse.ok) {
                const blob = await proxyResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName.includes('.') ? fileName : `${fileName}.${imageUrl.split('.').pop().split(/\#|\?/)[0] || 'jpg'}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return;
            }
        } catch (proxyError) {
            console.error("Proxy download failed:", proxyError);
        }

        // Fallback: try opening in a new tab if fetch fails
        window.open(imageUrl, '_blank');
    }
};
