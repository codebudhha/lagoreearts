import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ENV } from '../../../config/env.ts';
import type { StorageProvider, PutFileResult } from './storage.interface.ts';

export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly publicUrlPrefix: string;

  constructor(
    storagePath: string = ENV.MEDIA_STORAGE_PATH,
    publicUrlPrefix: string = ENV.MEDIA_PUBLIC_URL_PREFIX
  ) {
    this.rootDir = path.resolve(process.cwd(), storagePath);
    this.publicUrlPrefix = publicUrlPrefix.replace(/\/+$/, '');
  }

  /**
   * Helper: Get extension from MIME type or original filename
   */
  private getExtension(originalFilename: string, mimeType: string): string {
    const extFromMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/avif': '.avif'
    };

    if (extFromMime[mimeType.toLowerCase()]) {
      return extFromMime[mimeType.toLowerCase()];
    }

    const rawExt = path.extname(originalFilename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(rawExt)) {
      return rawExt;
    }

    return '.bin';
  }

  /**
   * Resolve and assert safe internal file path
   */
  private resolveSafePath(storageKey: string): string {
    const cleanKey = storageKey.replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
    const fullPath = path.resolve(this.rootDir, cleanKey);

    if (!fullPath.startsWith(this.rootDir)) {
      throw new Error('Path traversal attempt detected');
    }

    return fullPath;
  }

  async put(buffer: Buffer, originalFilename: string, mimeType: string): Promise<PutFileResult> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const ext = this.getExtension(originalFilename, mimeType);
    const uniqueFile = `${randomUUID()}${ext}`;
    const relativeKey = `${year}/${month}/${uniqueFile}`;

    const targetDir = path.resolve(this.rootDir, year, month);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = this.resolveSafePath(relativeKey);
    await fs.promises.writeFile(fullPath, buffer);

    return {
      storageKey: relativeKey.replace(/\\/g, '/'),
      publicUrl: this.getPublicUrl(relativeKey),
      fileSize: buffer.length
    };
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getBuffer(storageKey: string): Promise<Buffer | null> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      return await fs.promises.readFile(fullPath);
    } catch {
      return null;
    }
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  getPublicUrl(storageKey: string): string {
    const cleanKey = storageKey.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    return `${this.publicUrlPrefix}/${cleanKey}`;
  }
}

export const defaultStorageProvider: StorageProvider = new LocalStorageProvider();
