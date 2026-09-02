export interface PutFileResult {
  storageKey: string;
  publicUrl: string;
  fileSize: number;
}

export interface StorageProvider {
  /**
   * Save a file buffer to storage under a generated key
   */
  put(buffer: Buffer, originalFilename: string, mimeType: string): Promise<PutFileResult>;

  /**
   * Check if a file exists in storage
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Read file content from storage
   */
  getBuffer(storageKey: string): Promise<Buffer | null>;

  /**
   * Delete a file from storage
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Resolve the public accessible URL for a storage key
   */
  getPublicUrl(storageKey: string): string;
}
