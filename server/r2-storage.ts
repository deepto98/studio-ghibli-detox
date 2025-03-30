import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { Readable } from "stream";

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config(); // This loads the .env file contents into process.env

export interface IR2Storage {
  uploadImage(buffer: Buffer, contentType: string): Promise<string>;
  getImageUrl(key: string): Promise<string>;
  deleteImage(key: string): Promise<void>;
}

export class CloudflareR2Storage implements IR2Storage {
  private s3Client: S3Client;
  private bucket: string;
  
  constructor() {
    // Initialize S3 client with R2 credentials
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
      },
    });
    
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
  }
  
  /**
   * Uploads an image to R2 and returns the object key
   */
  async uploadImage(buffer: Buffer, contentType: string): Promise<string> {
    // Generate a unique key for the image
    const key = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await this.s3Client.send(command);
    return key;
  }
  
  /**
   * Gets a pre-signed URL for accessing an image
   */
  async getImageUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    // Create a pre-signed URL that expires in 24 hours (86400 seconds)
    return await getSignedUrl(this.s3Client, command, { expiresIn: 86400 });
  }
  
  /**
   * Deletes an image from R2
   */
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    await this.s3Client.send(command);
  }
  
  /**
   * Utility to convert a buffer to a stream for streaming uploads
   */
  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
}

// Export singleton instance
export const r2Storage = new CloudflareR2Storage();