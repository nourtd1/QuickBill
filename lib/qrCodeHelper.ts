import QRCodeUtil from 'qrcode';

/**
 * Generates a Base64 string of a QR Code for embedding in PDF HTML.
 * This function bypasses React components to be efficient for string manipulation.
 * 
 * @param value The text content to encode
 * @param options Styling options
 * @returns Promise<string> Base64 Data URL (e.g., "data:image/png;base64,...")
 */
export const generateQRCodeBase64 = async (value: string): Promise<string> => {
    try {
        const dataUrl = await QRCodeUtil.toDataURL(value, {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg',
            margin: 1,
            width: 300
        });
        return dataUrl;
    } catch (err) {
        console.error('Error generating QR code base64:', err);
        return '';
    }
};
