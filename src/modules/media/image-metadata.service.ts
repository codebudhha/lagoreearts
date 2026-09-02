import crypto from 'node:crypto';

export interface ImageInspectionResult {
  isValid: boolean;
  mimeType: string;
  width: number | null;
  height: number | null;
  checksum: string;
  fileSize: number;
  error?: string;
}

export class ImageMetadataService {
  /**
   * Allowed MIME types list
   */
  static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ];

  /**
   * Compute SHA-256 hash of a buffer
   */
  static calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Inspect and validate image buffer
   */
  static inspect(buffer: Buffer): ImageInspectionResult {
    const fileSize = buffer.length;
    const checksum = this.calculateChecksum(buffer);

    if (!buffer || buffer.length === 0) {
      return {
        isValid: false,
        mimeType: 'application/octet-stream',
        width: null,
        height: null,
        checksum,
        fileSize: 0,
        error: 'File buffer is empty'
      };
    }

    // 1. Check Magic Bytes for PNG
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      const dimensions = this.extractPngDimensions(buffer);
      return {
        isValid: true,
        mimeType: 'image/png',
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        checksum,
        fileSize
      };
    }

    // 2. Check Magic Bytes for JPEG (0xFF, 0xD8, 0xFF)
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      const dimensions = this.extractJpegDimensions(buffer);
      return {
        isValid: true,
        mimeType: 'image/jpeg',
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        checksum,
        fileSize
      };
    }

    // 3. Check Magic Bytes for WebP (RIFF....WEBP)
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const dimensions = this.extractWebpDimensions(buffer);
      return {
        isValid: true,
        mimeType: 'image/webp',
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        checksum,
        fileSize
      };
    }

    // 4. Check Magic Bytes for AVIF (ftypavif / ftypavis)
    if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
      const brand = buffer.toString('ascii', 8, 12);
      if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
        const dimensions = this.extractAvifDimensions(buffer);
        return {
          isValid: true,
          mimeType: 'image/avif',
          width: dimensions?.width || null,
          height: dimensions?.height || null,
          checksum,
          fileSize
        };
      }
    }

    // Reject all other formats (including SVG, text, html, zip, executables)
    return {
      isValid: false,
      mimeType: 'application/octet-stream',
      width: null,
      height: null,
      checksum,
      fileSize,
      error: 'Unsupported image format or signature mismatch'
    };
  }

  /**
   * Extract PNG Dimensions from IHDR chunk
   */
  private static extractPngDimensions(buffer: Buffer): { width: number; height: number } | null {
    if (buffer.length < 24) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  /**
   * Extract JPEG Dimensions from SOF markers
   */
  private static extractJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    let offset = 2;
    const len = buffer.length;

    while (offset < len) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2), SOF3 (0xC3), SOF9 (0xC9), SOF10 (0xCA)
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc9 && marker <= 0xcb)
      ) {
        if (offset + 9 <= len) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
      }

      // Skip marker payload
      if (offset + 4 <= len) {
        const markerLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + markerLength;
      } else {
        break;
      }
    }

    return null;
  }

  /**
   * Extract WebP Dimensions
   */
  private static extractWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
    if (buffer.length < 24) return null;
    const format = buffer.toString('ascii', 12, 16);

    // VP8 (Lossy)
    if (format === 'VP8 ' && buffer.length >= 26) {
      if (buffer[19] === 0x9d && buffer[20] === 0x01 && buffer[21] === 0x2a && buffer.length >= 26) {
        const width = buffer.readUInt16LE(22) & 0x3fff;
        const height = buffer.readUInt16LE(24) & 0x3fff;
        return { width, height };
      }
      if (buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
    }

    // VP8L (Lossless)
    if (format === 'VP8L' && buffer.length >= 25) {
      if (buffer[20] === 0x2f) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + ((((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)));
        return { width, height };
      }
    }

    // VP8X (Extended)
    if (format === 'VP8X' && buffer.length >= 30) {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }

    return null;
  }

  /**
   * Extract AVIF Dimensions from ISPE box if present
   */
  private static extractAvifDimensions(buffer: Buffer): { width: number; height: number } | null {
    const ispeIndex = buffer.indexOf(Buffer.from('ispe'));
    if (ispeIndex !== -1 && ispeIndex + 16 <= buffer.length) {
      // ispe structure: 4 bytes 'ispe', 4 bytes version+flags, 4 bytes width, 4 bytes height
      const width = buffer.readUInt32BE(ispeIndex + 8);
      const height = buffer.readUInt32BE(ispeIndex + 12);
      return { width, height };
    }
    return null;
  }
}
