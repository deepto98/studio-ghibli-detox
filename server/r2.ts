import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as crypto from 'crypto';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// Validate environment variables
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('Missing Cloudflare R2 credentials. Please set all required environment variables.');
    process.exit(1);
}
console.log("Bucket name", R2_BUCKET_NAME)
// Create S3 client for Cloudflare R2
const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// Generate a unique filename with timestamp and random string
export function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
}

// Upload file to R2 storage
export async function uploadFileToR2(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        });

        await S3.send(command);
        return filename;
    } catch (error) {
        console.error('Error uploading file to R2:', error);
        throw new Error('Failed to upload file to R2 storage');
    }
}

// Get signed URL for an object (valid for a limited time)
export async function getSignedFileUrl(filename: string, expiresIn = 3600): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
        });

        return await getSignedUrl(S3, command, { expiresIn });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate signed URL');
    }
}

// Delete a file from R2 storage
export async function deleteFileFromR2(filename: string): Promise<void> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
        });

        await S3.send(command);
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        throw new Error('Failed to delete file from R2 storage');
    }
}

// List all files in the bucket
export async function listFiles(): Promise<string[]> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
        });

        const response = await S3.send(command);
        return (response.Contents || []).map(item => item.Key || '').filter(Boolean);
    } catch (error) {
        console.error('Error listing files from R2:', error);
        throw new Error('Failed to list files from R2 storage');
    }
}

// Upload a base64 image to R2
export async function uploadBase64ImageToR2(
    base64Data: string,
    filename: string
): Promise<string> {
    try {
        // Strip the data URL prefix if present
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');

        // Determine content type from base64 data
        let contentType = 'image/png'; // Default
        if (base64Data.startsWith('data:image/jpeg')) {
            contentType = 'image/jpeg';
        } else if (base64Data.startsWith('data:image/webp')) {
            contentType = 'image/webp';
        }

        return await uploadFileToR2(buffer, filename, contentType);
    } catch (error) {
        console.error('Error uploading base64 image to R2:', error);
        throw new Error('Failed to upload base64 image to R2 storage');
    }
}