import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

/**
 * Uploads a local file to Supabase Storage.
 * @param uri Local file URI (from ImagePicker)
 * @param bucketName Supabase Storage bucket name (default: 'logos')
 * @returns Public URL of the uploaded file or throws error
 */
export async function uploadImage(uri: string, bucketName: string = 'logos'): Promise<string> {
    try {
        // 1. Read file as Base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // 2. Convert to ArrayBuffer
        const arrayBuffer = decode(base64);

        // 3. Generate unique filename
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 4. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: false,
            });

        if (error) throw error;

        // 5. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;

    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}
