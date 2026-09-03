import { createApp } from '../app.ts';
import { runSeed } from '../prisma/seed.ts';
import { prisma } from '../database/prisma.ts';
import { MediaMigrationService } from '../modules/media/media-migration.service.ts';
import { generateAccessToken } from '../security/jwt.ts';
import http from 'node:http';

const TEST_PORT = 5008;
let server: http.Server;
let baseUrl = `http://localhost:${TEST_PORT}`;

let superAdminToken = '';
let catalogueManagerToken = '';
let contentManagerToken = '';
let marketingManagerToken = '';
let orderManagerToken = '';

let testProductId = '';
let testVariantId = '';
let testCategoryId = '';
let testCollectionId = '';

let rootFolderId = '';
let subFolderId = '';

let testAssetId1 = '';
let testAssetId2 = '';
let testAssetId3 = '';
let orphanAssetId = '';

// Helper: Make HTTP requests
async function request(
  method: string,
  path: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: any }> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = { 'Accept': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let reqBody: any = undefined;
  if (body !== undefined) {
    if (Buffer.isBuffer(body)) {
      headers['Content-Type'] = 'application/octet-stream';
      reqBody = body;
    } else if (typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      const clone = { ...body };
      if (clone.file && Buffer.isBuffer(clone.file)) {
        clone.buffer = clone.file.toString('base64');
        delete clone.file;
      }
      reqBody = JSON.stringify(clone);
    } else {
      reqBody = String(body);
    }
  }

  const res = await fetch(url, { method, headers, body: reqBody });
  let parsed: any;
  const text = await res.text();
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

// Generate valid synthetic 1x1 image buffers
function generatePngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x04, 0x00, // Width: 1024
    0x00, 0x00, 0x03, 0x00, // Height: 768
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x5d, 0xb7, 0x8a, 0x9a, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
}

function generateJpegBuffer(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x00, 0x03, 0x00, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, // SOF0: height 512 (0x0200), width 768 (0x0300)
    0xff, 0xd9 // EOI
  ]);
}

function generateWebpBuffer(): Buffer {
  const header = Buffer.from('RIFF....WEBPVP8 ', 'ascii');
  const size = 30;
  header.writeUInt32LE(size - 8, 4);
  const vp8Data = Buffer.from([
    0x10, 0x00, 0x00, 0x9d, 0x01, 0x2a,
    0x50, 0x01, // width: 336
    0x90, 0x01  // height: 400
  ]);
  return Buffer.concat([header, vp8Data]);
}

function generateAvifBuffer(): Buffer {
  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x1c, // length
    0x66, 0x74, 0x79, 0x70, // ftyp
    0x61, 0x76, 0x69, 0x66, // avif
    0x00, 0x00, 0x00, 0x00, // minor version
    0x6d, 0x69, 0x66, 0x31, // compatible brands: mif1
    0x61, 0x76, 0x69, 0x66  // avif
  ]);
  const ispe = Buffer.from([
    0x00, 0x00, 0x00, 0x14, // length
    0x69, 0x73, 0x70, 0x65, // ispe
    0x00, 0x00, 0x00, 0x00, // flags
    0x00, 0x00, 0x05, 0x00, // width: 1280
    0x00, 0x00, 0x02, 0xd0  // height: 720
  ]);
  return Buffer.concat([ftyp, ispe]);
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`• Testing: ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
    passed++;
  } catch (err: any) {
    console.log('❌ FAILED');
    console.error(err);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting Lagoree Arts Module 8: Media Library & Asset Management Automated Test Suite...\n');

  const app = createApp();
  server = app.listen(TEST_PORT);
  baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // ==========================================
    // 0. ENVIRONMENT & ROLES SETUP
    // ==========================================
    await test('0. Environment & Admin Roles Setup', async () => {
      await runSeed();

      await prisma.productMedia.deleteMany({});
      await prisma.productVariantMedia.deleteMany({});
      await prisma.categoryMedia.deleteMany({});
      await prisma.collectionMedia.deleteMany({});
      await prisma.artistMedia.deleteMany({});
      await prisma.mediaAsset.deleteMany({});
      await prisma.mediaFolder.deleteMany({});

      const superRole = await prisma.role.findUnique({ where: { slug: 'SUPER_ADMIN' } });
      const catRole = await prisma.role.findUnique({ where: { slug: 'CATALOGUE_MANAGER' } });
      const contentRole = await prisma.role.findUnique({ where: { slug: 'CONTENT_MANAGER' } });
      const mktRole = await prisma.role.findUnique({ where: { slug: 'MARKETING_MANAGER' } });
      const ordRole = await prisma.role.findUnique({ where: { slug: 'ORDER_MANAGER' } });

      const superUser = await prisma.adminUser.findUnique({ where: { email: 'admin@lagoreearts.com' } });
      superAdminToken = generateAccessToken({ sub: superUser!.id, roleId: superRole!.id });

      let catUser = await prisma.adminUser.findUnique({ where: { email: 'curator.media@lagoreearts.com' } });
      if (!catUser) {
        catUser = await prisma.adminUser.create({
          data: {
            name: 'Media Curator',
            email: 'curator.media@lagoreearts.com',
            passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
            roleId: catRole!.id,
            status: 'ACTIVE'
          }
        });
      }
      catalogueManagerToken = generateAccessToken({ sub: catUser.id, roleId: catRole!.id });

      let contentUser = await prisma.adminUser.findUnique({ where: { email: 'content.media@lagoreearts.com' } });
      if (!contentUser) {
        contentUser = await prisma.adminUser.create({
          data: {
            name: 'Media Content Manager',
            email: 'content.media@lagoreearts.com',
            passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
            roleId: contentRole!.id,
            status: 'ACTIVE'
          }
        });
      }
      contentManagerToken = generateAccessToken({ sub: contentUser.id, roleId: contentRole!.id });

      let mktUser = await prisma.adminUser.findUnique({ where: { email: 'mkt.media@lagoreearts.com' } });
      if (!mktUser) {
        mktUser = await prisma.adminUser.create({
          data: {
            name: 'Marketing Media Manager',
            email: 'mkt.media@lagoreearts.com',
            passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
            roleId: mktRole!.id,
            status: 'ACTIVE'
          }
        });
      }
      marketingManagerToken = generateAccessToken({ sub: mktUser.id, roleId: mktRole!.id });

      let ordUser = await prisma.adminUser.findUnique({ where: { email: 'order.media@lagoreearts.com' } });
      if (!ordUser) {
        ordUser = await prisma.adminUser.create({
          data: {
            name: 'Order Manager',
            email: 'order.media@lagoreearts.com',
            passwordHash: '$2a$10$WqVbT1QdIeQx9qG2v.e3hec.mZ2d0dGy/N0Y/C14x3jY0R0f5.2.m',
            roleId: ordRole!.id,
            status: 'ACTIVE'
          }
        });
      }
      orderManagerToken = generateAccessToken({ sub: ordUser.id, roleId: ordRole!.id });

      // Prepare target entities for media attachment tests
      const cat = await prisma.category.findFirst();
      testCategoryId = cat!.id;

      const col = await prisma.collection.findFirst();
      testCollectionId = col!.id;

      // Create a test product
      const uniqueSuffix = Date.now().toString(36);
      const prod = await prisma.product.create({
        data: {
          name: 'Temple Arch Heritage Canvas ' + uniqueSuffix,
          slug: 'temple-arch-heritage-canvas-' + uniqueSuffix,
          sku: 'LA-CAN-' + uniqueSuffix,
          price: 12000,
          productType: 'VARIABLE',
          status: 'ACTIVE',
          categoryId: testCategoryId
        }
      });
      testProductId = prod.id;

      const opt = await prisma.productOption.create({
        data: { productId: prod.id, name: 'Dimension', slug: 'dimension' }
      });
      const val = await prisma.productOptionValue.create({
        data: { productOptionId: opt.id, value: 'Large 48x36', slug: 'large-48x36' }
      });
      const variant = await prisma.productVariant.create({
        data: {
          productId: prod.id,
          sku: 'LA-CAN-VAR-' + uniqueSuffix,
          price: 14000,
          status: 'ACTIVE'
        }
      });
      await prisma.productVariantOptionValue.create({
        data: { variantId: variant.id, optionValueId: val.id }
      });
      testVariantId = variant.id;
    });

    // ==========================================
    // A. MEDIA FOLDERS CRUD & HIERARCHY
    // ==========================================
    await test('1. Create Root Media Folder (POST /api/v1/admin/media/folders)', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media/folders',
        { name: 'Products & Artworks', slug: 'products-artworks' },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.slug !== 'products-artworks') {
        throw new Error(`Expected 201, got ${res.status}`);
      }
      rootFolderId = res.body.data.id;
    });

    await test('2. Create Child Media Folder under Root', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media/folders',
        { name: 'Bronze Statues', slug: 'bronze-statues', parentId: rootFolderId },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.parentId !== rootFolderId) {
        throw new Error(`Expected 201 child folder, got ${res.status}`);
      }
      subFolderId = res.body.data.id;
    });

    await test('3. Duplicate Folder Slug at Same Parent Level Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media/folders',
        { name: 'Another Bronze', slug: 'bronze-statues', parentId: rootFolderId },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_FOLDER_SLUG') {
        throw new Error(`Expected 400 DUPLICATE_FOLDER_SLUG, got ${res.status}`);
      }
    });

    await test('4. Same Slug under Different Parent Allowed', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media/folders',
        { name: 'Bronze Root', slug: 'bronze-statues', parentId: null },
        superAdminToken
      );
      if (res.status !== 201) {
        throw new Error(`Expected 201 for different parent, got ${res.status}`);
      }
      // Clean up this extra folder
      await prisma.mediaFolder.delete({ where: { id: res.body.data.id } });
    });

    await test('5. Invalid Parent ID Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media/folders',
        { name: 'Invalid Parent Folder', parentId: 'non-existent-uuid' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'INVALID_PARENT_FOLDER') {
        throw new Error(`Expected 400 INVALID_PARENT_FOLDER, got ${res.status}`);
      }
    });

    await test('6. Self-Parenting Folder Assignment Rejected (HTTP 400)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/media/folders/${rootFolderId}`,
        { parentId: rootFolderId },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'CIRCULAR_FOLDER_HIERARCHY') {
        throw new Error(`Expected 400 CIRCULAR_FOLDER_HIERARCHY, got ${res.status}`);
      }
    });

    await test('7. Circular Folder Hierarchy Loop Rejected (HTTP 400)', async () => {
      // Trying to make rootFolder a child of subFolder
      const res = await request(
        'PATCH',
        `/api/v1/admin/media/folders/${rootFolderId}`,
        { parentId: subFolderId },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'CIRCULAR_FOLDER_HIERARCHY') {
        throw new Error(`Expected 400 CIRCULAR_FOLDER_HIERARCHY, got ${res.status}`);
      }
    });

    await test('8. Update Folder Details & Name (PATCH /api/v1/admin/media/folders/:id)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/media/folders/${subFolderId}`,
        { name: 'Sacred Bronze Artifacts' },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.name !== 'Sacred Bronze Artifacts') {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    await test('9. Get Folder by ID (GET /api/v1/admin/media/folders/:id)', async () => {
      const res = await request('GET', `/api/v1/admin/media/folders/${subFolderId}`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.id !== subFolderId) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    await test('10. List Media Folders (GET /api/v1/admin/media/folders)', async () => {
      const res = await request('GET', '/api/v1/admin/media/folders', undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data)) {
        throw new Error(`Expected 200 array, got ${res.status}`);
      }
    });

    await test('11. Folder Deletion Blocked If Contains Subfolders (HTTP 409)', async () => {
      const res = await request('DELETE', `/api/v1/admin/media/folders/${rootFolderId}`, undefined, superAdminToken);
      if (res.status !== 409 || res.body.error?.code !== 'MEDIA_FOLDER_HAS_CHILDREN') {
        throw new Error(`Expected 409 MEDIA_FOLDER_HAS_CHILDREN, got ${res.status}`);
      }
    });

    // ==========================================
    // B. MEDIA UPLOAD SECURITY & IMAGE INSPECTION
    // ==========================================
    await test('12. Valid PNG Upload with Magic Bytes & Dimensions (POST /api/v1/admin/media)', async () => {
      const pngBuffer = generatePngBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        {
          file: pngBuffer,
          filename: 'temple-heritage.png',
          title: 'Temple Heritage Masterwork',
          altText: 'Traditional temple carving',
          caption: 'Handcrafted in Tanjore atelier',
          folderId: subFolderId
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.mimeType !== 'image/png' || res.body.data.width !== 1024) {
        throw new Error(`Expected 201 PNG with width 1024, got ${res.status}`);
      }
      testAssetId1 = res.body.data.id;
    });

    await test('13. Valid JPEG Upload with JFIF Header & Dimensions', async () => {
      const jpegBuffer = generateJpegBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        {
          file: jpegBuffer,
          filename: 'bronze-diya.jpg',
          title: 'Sacred Bronze Diya',
          altText: 'Antique Diya',
          folderId: subFolderId
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.mimeType !== 'image/jpeg' || res.body.data.width !== 768) {
        throw new Error(`Expected 201 JPEG with width 768, got ${res.status}`);
      }
      testAssetId2 = res.body.data.id;
    });

    await test('14. Valid WebP Upload with RIFF/WEBP Header & Dimensions', async () => {
      const webpBuffer = generateWebpBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        {
          file: webpBuffer,
          filename: 'sanskrit-canvas.webp',
          title: 'Sanskrit Canvas Art'
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.mimeType !== 'image/webp' || res.body.data.width !== 336) {
        throw new Error(`Expected 201 WebP with width 336, got ${res.status}`);
      }
      testAssetId3 = res.body.data.id;
    });

    await test('15. Valid AVIF Upload with ftyp Header & Dimensions', async () => {
      const avifBuffer = generateAvifBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        {
          file: avifBuffer,
          filename: 'royal-sculpture.avif',
          title: 'Royal Sculpture'
        },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.mimeType !== 'image/avif' || res.body.data.width !== 1280) {
        throw new Error(`Expected 201 AVIF with width 1280, got ${res.status}`);
      }
      orphanAssetId = res.body.data.id;
    });

    await test('16. SHA-256 Checksum Computed & Persisted Correctly', async () => {
      const res = await request('GET', `/api/v1/admin/media/${testAssetId1}`, undefined, superAdminToken);
      if (res.status !== 200 || !res.body.data.checksum || res.body.data.checksum.length !== 64) {
        throw new Error(`Expected 64-char SHA-256 checksum, got ${res.body.data.checksum}`);
      }
    });

    await test('17. Empty File Buffer Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: Buffer.alloc(0), filename: 'empty.jpg' },
        superAdminToken
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400 for empty file, got ${res.status}`);
      }
    });

    await test('18. Oversized File Exceeding Configured Limit Rejected (HTTP 413)', async () => {
      // 11 MB buffer
      const bigBuffer = Buffer.alloc(11 * 1024 * 1024);
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: bigBuffer, filename: 'huge.png' },
        superAdminToken
      );
      if (res.status !== 413 || res.body.error?.code !== 'MEDIA_TOO_LARGE') {
        throw new Error(`Expected 413 MEDIA_TOO_LARGE, got ${res.status}`);
      }
    });

    await test('19. Spoofed MIME / Plain Text Disguised as Image Rejected (HTTP 400)', async () => {
      const textBuffer = Buffer.from('This is actually a plain text script pretending to be image.jpg');
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: textBuffer, filename: 'fake.jpg' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'MEDIA_INVALID_IMAGE') {
        throw new Error(`Expected 400 MEDIA_INVALID_IMAGE, got ${res.status}`);
      }
    });

    await test('20. SVG File Rejected for Script / XSS Prevention (HTTP 400)', async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: svgBuffer, filename: 'attack.svg' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'MEDIA_INVALID_IMAGE') {
        throw new Error(`Expected 400 MEDIA_INVALID_IMAGE for SVG, got ${res.status}`);
      }
    });

    await test('21. Corrupted / Malformed Image Header Rejected (HTTP 400)', async () => {
      const malformedBuffer = Buffer.from([0xff, 0xd8, 0x00, 0x00, 0x12, 0x34]);
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: malformedBuffer, filename: 'corrupted.jpg' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'MEDIA_INVALID_IMAGE') {
        throw new Error(`Expected 400 MEDIA_INVALID_IMAGE, got ${res.status}`);
      }
    });

    await test('22. Unsafe Client Filename Sanitized into Generated Safe Storage Key', async () => {
      const pngBuffer = generatePngBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: pngBuffer, filename: '../../../etc/passwd.png' },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.url.includes('..')) {
        throw new Error(`Storage key contains unsafe path traversal: ${res.body.data.url}`);
      }
      await prisma.mediaAsset.delete({ where: { id: res.body.data.id } });
    });

    await test('23. Upload with Non-Existent Folder ID Rejected (HTTP 400)', async () => {
      const pngBuffer = generatePngBuffer();
      const res = await request(
        'POST',
        '/api/v1/admin/media',
        { file: pngBuffer, filename: 'valid.png', folderId: 'non-existent-folder-id' },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'MEDIA_FOLDER_NOT_FOUND') {
        throw new Error(`Expected 400 MEDIA_FOLDER_NOT_FOUND, got ${res.status}`);
      }
    });

    await test('24. Folder Deletion Blocked If Contains Media Assets (HTTP 409)', async () => {
      const res = await request('DELETE', `/api/v1/admin/media/folders/${subFolderId}`, undefined, superAdminToken);
      if (res.status !== 409 || res.body.error?.code !== 'MEDIA_FOLDER_NOT_EMPTY') {
        throw new Error(`Expected 409 MEDIA_FOLDER_NOT_EMPTY, got ${res.status}`);
      }
    });

    // ==========================================
    // C. MEDIA ASSET CRUD & METADATA MANAGEMENT
    // ==========================================
    await test('25. Get Media Asset by ID (GET /api/v1/admin/media/:id)', async () => {
      const res = await request('GET', `/api/v1/admin/media/${testAssetId1}`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.id !== testAssetId1) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    await test('26. Non-Existent Media Asset Returns HTTP 404', async () => {
      const res = await request('GET', '/api/v1/admin/media/non-existent-media-id', undefined, superAdminToken);
      if (res.status !== 404 || res.body.error?.code !== 'MEDIA_NOT_FOUND') {
        throw new Error(`Expected 404 MEDIA_NOT_FOUND, got ${res.status}`);
      }
    });

    await test('27. Update Media Metadata (Title, Alt Text, Caption)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/media/${testAssetId1}`,
        {
          title: 'Updated Masterwork Title',
          altText: 'Updated Alt Text',
          caption: 'Updated Historical Caption'
        },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.title !== 'Updated Masterwork Title') {
        throw new Error(`Expected 200 updated metadata, got ${res.status}`);
      }
    });

    await test('28. Move Media Asset to Different Folder (PATCH /api/v1/admin/media/:id)', async () => {
      const res = await request(
        'PATCH',
        `/api/v1/admin/media/${testAssetId1}`,
        { folderId: rootFolderId },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data.folderId !== rootFolderId) {
        throw new Error(`Expected 200 folder move, got ${res.status}`);
      }
    });

    await test('29. List Media with Pagination (GET /api/v1/admin/media?page=1&limit=2)', async () => {
      const res = await request('GET', '/api/v1/admin/media?page=1&limit=2', undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length > 2) {
        throw new Error(`Expected 200 with paginated array <= 2 items, got ${res.status}`);
      }
    });

    await test('30. Filter Media by Folder ID', async () => {
      const res = await request('GET', `/api/v1/admin/media?folderId=${rootFolderId}`, undefined, superAdminToken);
      if (res.status !== 200 || !res.body.data.some((a: any) => a.id === testAssetId1)) {
        throw new Error(`Expected media in folder ${rootFolderId}, got ${res.status}`);
      }
    });

    await test('31. Filter Media by MIME Type (image/png)', async () => {
      const res = await request('GET', '/api/v1/admin/media?mimeType=image/png', undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.some((a: any) => a.mimeType !== 'image/png')) {
        throw new Error(`Expected only image/png items, got ${res.status}`);
      }
    });

    await test('32. Search Media by Title / Filename Query', async () => {
      const res = await request('GET', '/api/v1/admin/media?search=Masterwork', undefined, superAdminToken);
      if (res.status !== 200 || !res.body.data.some((a: any) => a.id === testAssetId1)) {
        throw new Error(`Expected search match for Masterwork, got ${res.status}`);
      }
    });

    await test('33. Sort Media by File Size Descending', async () => {
      const res = await request('GET', '/api/v1/admin/media?sortBy=fileSize&sortOrder=desc', undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data)) {
        throw new Error(`Expected sorted list, got ${res.status}`);
      }
    });

    // ==========================================
    // D. PRODUCT MEDIA ATTACHMENTS & PRIMARY INVARIANT
    // ==========================================
    await test('34. Attach Media to Product as Primary (POST /api/v1/admin/products/:id/media)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/media`,
        { mediaId: testAssetId1, isPrimary: true, role: 'PRIMARY', sortOrder: 0 },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.isPrimary !== true) {
        throw new Error(`Expected 201 attached primary, got ${res.status}`);
      }
    });

    await test('35. Duplicate Media Attachment to Same Product Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/media`,
        { mediaId: testAssetId1 },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_MEDIA_ATTACHMENT') {
        throw new Error(`Expected 400 DUPLICATE_MEDIA_ATTACHMENT, got ${res.status}`);
      }
    });

    await test('36. Attach Second Media to Product as Gallery', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/media`,
        { mediaId: testAssetId2, isPrimary: false, role: 'GALLERY', sortOrder: 1 },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.role !== 'GALLERY') {
        throw new Error(`Expected 201 gallery attachment, got ${res.status}`);
      }
    });

    await test('37. List Product Media (GET /api/v1/admin/products/:id/media)', async () => {
      const res = await request('GET', `/api/v1/admin/products/${testProductId}/media`, undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length !== 2) {
        throw new Error(`Expected 2 product media items, got ${res.status}`);
      }
    });

    await test('38. Product Single Primary Invariant: Setting Second Media Primary Unsets First', async () => {
      // Attach third media with isPrimary: true
      await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/media`,
        { mediaId: testAssetId3, isPrimary: true, role: 'PRIMARY', sortOrder: 2 },
        superAdminToken
      );

      const listRes = await request('GET', `/api/v1/admin/products/${testProductId}/media`, undefined, superAdminToken);
      const primaries = listRes.body.data.filter((m: any) => m.isPrimary);
      if (primaries.length !== 1 || primaries[0].mediaId !== testAssetId3) {
        throw new Error(`Expected exactly 1 primary (testAssetId3), found ${primaries.length}`);
      }
    });

    await test('39. Bulk Reorder Product Media (PUT /api/v1/admin/products/:id/media/order)', async () => {
      const res = await request(
        'PUT',
        `/api/v1/admin/products/${testProductId}/media/order`,
        {
          items: [
            { mediaId: testAssetId2, sortOrder: 0 },
            { mediaId: testAssetId1, sortOrder: 1 },
            { mediaId: testAssetId3, sortOrder: 2 }
          ]
        },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data[0].mediaId !== testAssetId2) {
        throw new Error(`Expected reordered list starting with testAssetId2, got ${res.status}`);
      }
    });

    await test('40. Detach Media from Product (DELETE /api/v1/admin/products/:id/media/:mediaId)', async () => {
      const res = await request(
        'DELETE',
        `/api/v1/admin/products/${testProductId}/media/${testAssetId3}`,
        undefined,
        superAdminToken
      );
      if (res.status !== 200) {
        throw new Error(`Expected 200 on detach, got ${res.status}`);
      }
    });

    await test('41. Detach Non-Attached Media from Product Returns HTTP 404', async () => {
      const res = await request(
        'DELETE',
        `/api/v1/admin/products/${testProductId}/media/${orphanAssetId}`,
        undefined,
        superAdminToken
      );
      if (res.status !== 404 || res.body.error?.code !== 'MEDIA_NOT_ATTACHED') {
        throw new Error(`Expected 404 MEDIA_NOT_ATTACHED, got ${res.status}`);
      }
    });

    // ==========================================
    // E. VARIANT MEDIA ATTACHMENTS
    // ==========================================
    await test('42. Attach Media to Product Variant (POST /api/v1/admin/products/:id/variants/:varId/media)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media`,
        { mediaId: testAssetId2, isPrimary: true, role: 'PRIMARY', sortOrder: 0 },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.isPrimary !== true) {
        throw new Error(`Expected 201 variant media attached, got ${res.status}`);
      }
    });

    await test('43. Duplicate Variant Media Attachment Rejected (HTTP 400)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media`,
        { mediaId: testAssetId2 },
        superAdminToken
      );
      if (res.status !== 400 || res.body.error?.code !== 'DUPLICATE_MEDIA_ATTACHMENT') {
        throw new Error(`Expected 400 DUPLICATE_MEDIA_ATTACHMENT, got ${res.status}`);
      }
    });

    await test('44. List Variant Media (GET /api/v1/admin/products/:id/variants/:varId/media)', async () => {
      const res = await request(
        'GET',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media`,
        undefined,
        superAdminToken
      );
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 1) {
        throw new Error(`Expected variant media array, got ${res.status}`);
      }
    });

    await test('45. Variant Media Single Primary Invariant Enforcement', async () => {
      await request(
        'POST',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media`,
        { mediaId: testAssetId1, isPrimary: true, role: 'PRIMARY', sortOrder: 1 },
        superAdminToken
      );
      const listRes = await request(
        'GET',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media`,
        undefined,
        superAdminToken
      );
      const primaries = listRes.body.data.filter((m: any) => m.isPrimary);
      if (primaries.length !== 1 || primaries[0].mediaId !== testAssetId1) {
        throw new Error(`Expected exactly 1 primary variant media (testAssetId1), got ${primaries.length}`);
      }
    });

    await test('46. Bulk Reorder Variant Media (PUT /api/v1/admin/products/:id/variants/:varId/media/order)', async () => {
      const res = await request(
        'PUT',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media/order`,
        {
          items: [
            { mediaId: testAssetId1, sortOrder: 0 },
            { mediaId: testAssetId2, sortOrder: 1 }
          ]
        },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data[0].mediaId !== testAssetId1) {
        throw new Error(`Expected reordered variant media, got ${res.status}`);
      }
    });

    await test('47. Detach Media from Variant (DELETE /api/v1/admin/products/:id/variants/:varId/media/:mediaId)', async () => {
      const res = await request(
        'DELETE',
        `/api/v1/admin/products/${testProductId}/variants/${testVariantId}/media/${testAssetId1}`,
        undefined,
        superAdminToken
      );
      if (res.status !== 200) {
        throw new Error(`Expected 200 on variant detach, got ${res.status}`);
      }
    });

    // ==========================================
    // F. CATEGORY MEDIA ATTACHMENTS
    // ==========================================
    await test('48. Attach Primary & Banner Media to Category (POST /api/v1/admin/categories/:id/media)', async () => {
      const res1 = await request(
        'POST',
        `/api/v1/admin/categories/${testCategoryId}/media`,
        { mediaId: testAssetId1, isPrimary: true, role: 'PRIMARY', sortOrder: 0 },
        superAdminToken
      );
      const res2 = await request(
        'POST',
        `/api/v1/admin/categories/${testCategoryId}/media`,
        { mediaId: testAssetId2, isPrimary: false, role: 'BANNER', sortOrder: 1 },
        superAdminToken
      );
      if (res1.status !== 201 || res2.status !== 201) {
        throw new Error(`Expected 201 category media attachments, got ${res1.status}, ${res2.status}`);
      }
    });

    await test('49. List Category Media (GET /api/v1/admin/categories/:id/media)', async () => {
      const res = await request('GET', `/api/v1/admin/categories/${testCategoryId}/media`, undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 2) {
        throw new Error(`Expected category media list, got ${res.status}`);
      }
    });

    await test('50. Category Single Primary Invariant Enforcement', async () => {
      await request(
        'POST',
        `/api/v1/admin/categories/${testCategoryId}/media`,
        { mediaId: testAssetId3, isPrimary: true, role: 'PRIMARY', sortOrder: 2 },
        superAdminToken
      );
      const listRes = await request('GET', `/api/v1/admin/categories/${testCategoryId}/media`, undefined, superAdminToken);
      const primaries = listRes.body.data.filter((m: any) => m.isPrimary);
      if (primaries.length !== 1 || primaries[0].mediaId !== testAssetId3) {
        throw new Error(`Expected exactly 1 category primary, got ${primaries.length}`);
      }
    });

    await test('51. Reorder Category Media (PUT /api/v1/admin/categories/:id/media/order)', async () => {
      const res = await request(
        'PUT',
        `/api/v1/admin/categories/${testCategoryId}/media/order`,
        {
          items: [
            { mediaId: testAssetId3, sortOrder: 0 },
            { mediaId: testAssetId1, sortOrder: 1 },
            { mediaId: testAssetId2, sortOrder: 2 }
          ]
        },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data[0].mediaId !== testAssetId3) {
        throw new Error(`Expected reordered category media, got ${res.status}`);
      }
    });

    await test('52. Detach Media from Category (DELETE /api/v1/admin/categories/:id/media/:mediaId)', async () => {
      const res = await request(
        'DELETE',
        `/api/v1/admin/categories/${testCategoryId}/media/${testAssetId3}`,
        undefined,
        superAdminToken
      );
      if (res.status !== 200) {
        throw new Error(`Expected 200 on category detach, got ${res.status}`);
      }
    });

    // ==========================================
    // G. COLLECTION MEDIA ATTACHMENTS
    // ==========================================
    await test('53. Attach Media to Collection (POST /api/v1/admin/collections/:id/media)', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/collections/${testCollectionId}/media`,
        { mediaId: testAssetId1, isPrimary: true, role: 'PRIMARY', sortOrder: 0 },
        superAdminToken
      );
      if (res.status !== 201 || res.body.data.isPrimary !== true) {
        throw new Error(`Expected 201 collection media attachment, got ${res.status}`);
      }
    });

    await test('54. List Collection Media (GET /api/v1/admin/collections/:id/media)', async () => {
      const res = await request('GET', `/api/v1/admin/collections/${testCollectionId}/media`, undefined, superAdminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length < 1) {
        throw new Error(`Expected collection media list, got ${res.status}`);
      }
    });

    await test('55. Collection Single Primary Invariant Enforcement', async () => {
      await request(
        'POST',
        `/api/v1/admin/collections/${testCollectionId}/media`,
        { mediaId: testAssetId3, isPrimary: true, role: 'PRIMARY', sortOrder: 1 },
        superAdminToken
      );
      const listRes = await request('GET', `/api/v1/admin/collections/${testCollectionId}/media`, undefined, superAdminToken);
      const primaries = listRes.body.data.filter((m: any) => m.isPrimary);
      if (primaries.length !== 1 || primaries[0].mediaId !== testAssetId3) {
        throw new Error(`Expected exactly 1 primary collection media, got ${primaries.length}`);
      }
    });

    await test('56. Reorder Collection Media (PUT /api/v1/admin/collections/:id/media/order)', async () => {
      const res = await request(
        'PUT',
        `/api/v1/admin/collections/${testCollectionId}/media/order`,
        {
          items: [
            { mediaId: testAssetId3, sortOrder: 0 },
            { mediaId: testAssetId1, sortOrder: 1 }
          ]
        },
        superAdminToken
      );
      if (res.status !== 200 || res.body.data[0].mediaId !== testAssetId3) {
        throw new Error(`Expected reordered collection media, got ${res.status}`);
      }
    });

    await test('57. Detach Media from Collection (DELETE /api/v1/admin/collections/:id/media/:mediaId)', async () => {
      const res = await request(
        'DELETE',
        `/api/v1/admin/collections/${testCollectionId}/media/${testAssetId3}`,
        undefined,
        superAdminToken
      );
      if (res.status !== 200) {
        throw new Error(`Expected 200 on collection detach, got ${res.status}`);
      }
    });

    // ==========================================
    // H. SAFE DELETION & CASCADE PROTECTION
    // ==========================================
    await test('58. Deleting Media Attached to Product Blocked (HTTP 409 MEDIA_IN_USE)', async () => {
      const res = await request('DELETE', `/api/v1/admin/media/${testAssetId1}`, undefined, superAdminToken);
      if (res.status !== 409 || res.body.error?.code !== 'MEDIA_IN_USE') {
        throw new Error(`Expected 409 MEDIA_IN_USE, got ${res.status}`);
      }
    });

    await test('59. Deleting Media Attached to Variant Blocked (HTTP 409 MEDIA_IN_USE)', async () => {
      const res = await request('DELETE', `/api/v1/admin/media/${testAssetId2}`, undefined, superAdminToken);
      if (res.status !== 409 || res.body.error?.code !== 'MEDIA_IN_USE') {
        throw new Error(`Expected 409 MEDIA_IN_USE, got ${res.status}`);
      }
    });

    await test('60. Safe Deletion of Unattached Media Asset (DELETE /api/v1/admin/media/:id)', async () => {
      const res = await request('DELETE', `/api/v1/admin/media/${orphanAssetId}`, undefined, superAdminToken);
      if (res.status !== 200 || res.body.data.success !== true) {
        throw new Error(`Expected 200 on orphan media delete, got ${res.status}`);
      }
      // Verify deleted from DB
      const check = await prisma.mediaAsset.findUnique({ where: { id: orphanAssetId } });
      if (check) {
        throw new Error('Media asset still present in database after delete');
      }
    });

    // ==========================================
    // I. ORPHAN DETECTION
    // ==========================================
    await test('61. List Orphaned Media Assets (GET /api/v1/admin/media/orphans)', async () => {
      // Upload a new unattached orphan
      const orphanPng = generatePngBuffer();
      const createRes = await request(
        'POST',
        '/api/v1/admin/media',
        { file: orphanPng, filename: 'orphan-asset.png', title: 'Unattached Orphan' },
        superAdminToken
      );
      const newOrphanId = createRes.body.data.id;

      const orphanList = await request('GET', '/api/v1/admin/media/orphans', undefined, superAdminToken);
      if (orphanList.status !== 200 || !orphanList.body.data.some((a: any) => a.id === newOrphanId)) {
        throw new Error(`Expected new orphan in orphans list, got ${orphanList.status}`);
      }

      // Verify attached media (testAssetId1) is NOT in orphan list
      if (orphanList.body.data.some((a: any) => a.id === testAssetId1)) {
        throw new Error(`Attached media ${testAssetId1} incorrectly listed in orphans`);
      }

      await prisma.mediaAsset.delete({ where: { id: newOrphanId } });
    });

    // ==========================================
    // J. BACKWARD COMPATIBILITY & PUBLIC STOREFRONT
    // ==========================================
    await test('62. Public Product API Returns Rich Media Array and Primary Image', async () => {
      const prod = await prisma.product.findUnique({ where: { id: testProductId } });
      const res = await request('GET', `/api/v1/products/${prod!.slug}`);
      if (res.status !== 200 || !Array.isArray(res.body.data.media) || res.body.data.media.length < 1) {
        throw new Error(`Expected public product with media array, got ${res.status}`);
      }
      if (!res.body.data.image) {
        throw new Error('Public product image URL not derived from media');
      }
    });

    await test('63. Public Product API Falls Back to Legacy Image String When No Media Attached', async () => {
      const uniqueSuffix2 = Date.now().toString(36);
      const fallbackProd = await prisma.product.create({
        data: {
          name: 'Legacy Diya ' + uniqueSuffix2,
          slug: 'legacy-diya-' + uniqueSuffix2,
          sku: 'LA-LEG-' + uniqueSuffix2,
          price: 5000,
          image: '/legacy/path/diya.jpg',
          status: 'ACTIVE',
          categoryId: testCategoryId
        }
      });

      const res = await request('GET', `/api/v1/products/${fallbackProd.slug}`);
      if (res.status !== 200 || res.body.data.image !== '/legacy/path/diya.jpg') {
        throw new Error(`Expected legacy image fallback, got ${res.body.data?.image}`);
      }
      await prisma.product.delete({ where: { id: fallbackProd.id } });
    });

    await test('64. Public Collection API Returns Rich Media and Primary Fallback', async () => {
      const col = await prisma.collection.findUnique({ where: { id: testCollectionId } });
      const res = await request('GET', `/api/v1/collections/${col!.slug}`);
      if (res.status !== 200 || !Array.isArray(res.body.data.media)) {
        throw new Error(`Expected public collection with media, got ${res.status}`);
      }
    });

    await test('65. Public Category Detail Includes Rich Media', async () => {
      const cat = await prisma.category.findUnique({ where: { id: testCategoryId }, include: { media: { include: { media: true } } } });
      if (!cat?.media || cat.media.length < 1) {
        throw new Error('Category media relations not populated in category entity');
      }
    });

    await test('66. Public Media Response Sanitizes Filesystem Paths and Secrets', async () => {
      const res = await request('GET', `/api/v1/admin/media/${testAssetId1}`, undefined, superAdminToken);
      if (res.body.data.storagePath || res.body.data.internalPath) {
        throw new Error('Internal filesystem paths exposed in media response');
      }
    });

    // ==========================================
    // K. LEGACY MIGRATION UTILITY
    // ==========================================
    await test('67. MediaMigrationService Backfills Legacy Strings Idempotently', async () => {
      const migrationResult = await MediaMigrationService.migrateLegacyImages();
      if (typeof migrationResult.migratedProducts !== 'number') {
        throw new Error('Migration did not return migration counts');
      }

      // Second run must be idempotent (0 new items migrated)
      const secondRun = await MediaMigrationService.migrateLegacyImages();
      if (secondRun.migratedProducts !== 0) {
        throw new Error(`Migration not idempotent: migrated ${secondRun.migratedProducts} products on second run`);
      }
    });

    // ==========================================
    // L. RBAC & PERMISSIONS MATRIX
    // ==========================================
    await test('68. RBAC: SUPER_ADMIN Authorized for All Media Endpoints (HTTP 200/201)', async () => {
      const res = await request('GET', '/api/v1/admin/media', undefined, superAdminToken);
      if (res.status !== 200) {
        throw new Error(`Super admin rejected on media list: ${res.status}`);
      }
    });

    await test('69. RBAC: CATALOGUE_MANAGER Authorized for Media & Folders', async () => {
      const listRes = await request('GET', '/api/v1/admin/media', undefined, catalogueManagerToken);
      const folderRes = await request('GET', '/api/v1/admin/media/folders', undefined, catalogueManagerToken);
      if (listRes.status !== 200 || folderRes.status !== 200) {
        throw new Error(`Catalogue manager rejected: ${listRes.status}, ${folderRes.status}`);
      }
    });

    await test('70. RBAC: CONTENT_MANAGER Allowed Upload & Update, Denied Delete (HTTP 403)', async () => {
      // Allowed upload
      const pngBuffer = generatePngBuffer();
      const uploadRes = await request(
        'POST',
        '/api/v1/admin/media',
        { file: pngBuffer, filename: 'content-upload.png' },
        contentManagerToken
      );
      if (uploadRes.status !== 201) {
        throw new Error(`Content manager upload failed: ${uploadRes.status}`);
      }
      const uploadedId = uploadRes.body.data.id;

      // Denied delete
      const delRes = await request('DELETE', `/api/v1/admin/media/${uploadedId}`, undefined, contentManagerToken);
      if (delRes.status !== 403) {
        throw new Error(`Expected 403 for content manager media delete, got ${delRes.status}`);
      }

      await prisma.mediaAsset.delete({ where: { id: uploadedId } });
    });

    await test('71. RBAC: MARKETING_MANAGER View-Only (Upload Denied HTTP 403)', async () => {
      const viewRes = await request('GET', '/api/v1/admin/media', undefined, marketingManagerToken);
      if (viewRes.status !== 200) {
        throw new Error(`Marketing manager view failed: ${viewRes.status}`);
      }

      const pngBuffer = generatePngBuffer();
      const uploadRes = await request(
        'POST',
        '/api/v1/admin/media',
        { file: pngBuffer, filename: 'mkt-upload.png' },
        marketingManagerToken
      );
      if (uploadRes.status !== 403) {
        throw new Error(`Expected 403 for marketing manager media upload, got ${uploadRes.status}`);
      }
    });

    await test('72. RBAC: ORDER_MANAGER Denied All Media Endpoints (HTTP 403)', async () => {
      const res = await request('GET', '/api/v1/admin/media', undefined, orderManagerToken);
      if (res.status !== 403) {
        throw new Error(`Expected 403 for order manager, got ${res.status}`);
      }
    });

    await test('73. Admin Media Endpoints Require Authentication (HTTP 401 on Missing Token)', async () => {
      const res = await request('GET', '/api/v1/admin/media');
      if (res.status !== 401) {
        throw new Error(`Expected 401 unauthenticated, got ${res.status}`);
      }
    });

    // ==========================================
    // M. AUDIT LOGGING VERIFICATION
    // ==========================================
    await test('74. Audit Log on Media Folder Create (MEDIA_FOLDER_CREATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_FOLDER_CREATED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_FOLDER_CREATED not found');
      }
    });

    await test('75. Audit Log on Media Upload (MEDIA_CREATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_CREATED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_CREATED not found');
      }
    });

    await test('76. Audit Log on Media Update (MEDIA_UPDATED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_UPDATED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_UPDATED not found');
      }
    });

    await test('77. Audit Log on Media Delete (MEDIA_DELETED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_DELETED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_DELETED not found');
      }
    });

    await test('78. Audit Log on Media Attach (MEDIA_ATTACHED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_ATTACHED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_ATTACHED not found');
      }
    });

    await test('79. Audit Log on Primary Media Changed (MEDIA_PRIMARY_CHANGED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_PRIMARY_CHANGED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_PRIMARY_CHANGED not found');
      }
    });

    await test('80. Audit Log on Media Reorder (MEDIA_REORDERED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_REORDERED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_REORDERED not found');
      }
    });

    await test('81. Audit Log on Media Detach (MEDIA_DETACHED)', async () => {
      const logs = await prisma.adminAuditLog.findMany({
        where: { action: 'MEDIA_DETACHED' }
      });
      if (!logs || logs.length === 0) {
        throw new Error('Audit log for MEDIA_DETACHED not found');
      }
    });

  } catch (err: any) {
    console.error('Fatal error during test run:', err);
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n------------------------------------------------');
  console.log(`🎉 Module 8 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
