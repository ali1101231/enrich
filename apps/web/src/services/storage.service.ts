import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../lib/env.js";
import { logInfo, logError } from "../lib/logger.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export class StorageService {
  private readonly bucket = env.R2_BUCKET_NAME;

  /**
   * Build a deterministic R2 key for an uploaded CSV.
   * Format: uploads/{userId}/{batchId}/{originalFileName}
   */
  buildUploadKey(userId: string, batchId: string, fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `uploads/${userId}/${batchId}/${safeName}`;
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    logInfo("File uploaded to R2", { key, bucket: this.bucket, size: buffer.length });
  }

  async getObject(key: string): Promise<Buffer> {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error(`Empty body for R2 key: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    logInfo("File deleted from R2", { key, bucket: this.bucket });
  }

  getPublicUrl(key: string): string | null {
    if (!env.R2_PUBLIC_BASE_URL) return null;
    return `${env.R2_PUBLIC_BASE_URL}/${key}`;
  }
}
