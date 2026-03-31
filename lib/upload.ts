import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

/**
 * Uploads a local file to Supabase Storage with optimization.
 * @param uri Local file URI (from ImagePicker)
 * @param bucketName Supabase Storage bucket name (default: 'logos')
 * @returns Public URL of the uploaded file or throws error
 */
export async function uploadImage(uri: string, bucketName: string = 'logos'): Promise<string> {
    try {
        // 1. Optimize Image (Resize and Compress)
        // We target a reasonable size for business logos/reiceipts to save bandwidth and storage
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1200 } }], // Max 1200px width
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // 2. Read file as Base64 from the manipulated uri
        const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
            encoding: 'base64',
        });

        // 3. Convert to ArrayBuffer
        const arrayBuffer = decode(base64);

        // 4. Generate unique filename (always .jpg due to conversion)
        const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${fileName}`;

        // 5. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (error) throw error;

        // 6. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;

    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}
