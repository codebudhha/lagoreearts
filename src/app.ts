import express from './utils/express.ts';
import { ENV } from './config/env.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { adminAuthRoutes } from './modules/admin-auth/admin-auth.routes.ts';
import { adminUsersRoutes } from './modules/admin-users/admin-users.routes.ts';
import { adminRolesRoutes } from './modules/admin-roles/admin-roles.routes.ts';
import { adminCategoriesRoutes, publicCategoriesRoutes } from './modules/categories/categories.routes.ts';
import { adminAttributesRoutes, publicAttributesRoutes } from './modules/attributes/attributes.routes.ts';
import { adminCategoryFiltersRoutes, publicCategoryFiltersRoutes } from './modules/category-filters/category-filters.routes.ts';
import { adminCollectionsRoutes, publicCollectionsRoutes } from './modules/collections/collections.routes.ts';
import { adminProductsRoutes, publicProductsRoutes } from './modules/products/products.routes.ts';
import { ApiResponse } from './utils/apiResponse.ts';

import path from 'node:path';

export function createApp() {
  const app = express();
  const rootDir = process.cwd();

  // 1. Security & Standard Middlewares
  app.set('trust proxy', 1);

  // Serve static files (HTML, CSS, JS, images)
  app.use(express.static(rootDir));

  // Parse JSON bodies
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Basic Cookie Parser
  app.use((req, res, next) => {
    const rawCookies = req.headers.cookie;
    (req as any).cookies = {};
    if (rawCookies) {
      rawCookies.split(';').forEach(c => {
        const [k, v] = c.trim().split('=');
        if (k && v) {
          (req as any).cookies[decodeURIComponent(k)] = decodeURIComponent(v);
        }
      });
    }
    next();
  });

  // CORS Policy (Strict Admin Origin or localhost in dev)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      ENV.ADMIN_FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Security Headers (Helmet equivalents)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // 2. Health & Root Diagnostic Check
  app.get('/', (req, res) => {
    // If browser requesting HTML, serve homepage
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
      return res.sendFile(path.join(rootDir, 'Lagoree Homepage.html'));
    }
    return ApiResponse.success(res, {
      brand: 'Lagoree Arts Luxury E-Commerce Backend',
      version: '1.0.0',
      status: 'healthy',
      storefrontPages: {
        homepage: '/storefront',
        category: '/category',
        product: '/product',
        cart: '/cart',
        lookbook: '/lookbook',
        login: '/login',
        about: '/about'
      },
      endpoints: {
        health: '/api/v1/admin/health',
        adminAuth: '/api/v1/admin/auth/login',
        products: '/api/v1/products',
        categories: '/api/v1/categories',
        collections: '/api/v1/collections',
        attributes: '/api/v1/attributes'
      },
      timestamp: new Date().toISOString()
    }, 200, 'Welcome to Lagoree Arts API');
  });

  // Storefront Visual HTML Page Routes
  app.get('/storefront', (req, res) => res.sendFile(path.join(rootDir, 'Lagoree Homepage.html')));
  app.get('/home', (req, res) => res.sendFile(path.join(rootDir, 'Lagoree Homepage.html')));
  app.get('/category', (req, res) => res.sendFile(path.join(rootDir, 'Lagoree Category.html')));
  app.get('/product', (req, res) => res.sendFile(path.join(rootDir, 'Lagoree_Product Claude.html')));
  app.get('/cart', (req, res) => res.sendFile(path.join(rootDir, 'Lagoree_Cart claude.html')));
  app.get('/lookbook', (req, res) => res.sendFile(path.join(rootDir, 'Lookbook - Lagoree Arts.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(rootDir, 'Login-Register - Lagoree Arts.html')));
  app.get('/about', (req, res) => res.sendFile(path.join(rootDir, 'About - Lagoree Arts.html')));

  app.get('/api/v1/admin/health', (req, res) => {
    return ApiResponse.success(res, {
      status: 'healthy',
      modules: [
        'Module 1: Backend Foundation',
        'Module 2: Admin Authentication & RBAC',
        'Module 3: Categories & Hierarchy',
        'Module 4: Attributes & Dynamic Filter Engine',
        'Module 5: Collections',
        'Module 6: Product Catalogue Management'
      ],
      brand: 'Lagoree Arts',
      timestamp: new Date().toISOString()
    });
  });

  // 3. Module Routes
  app.use('/api/v1/admin/auth', adminAuthRoutes);
  app.use('/api/v1/admin/users', adminUsersRoutes);
  app.use('/api/v1/admin/roles', adminRolesRoutes);
  app.use('/api/v1/admin/categories', adminCategoryFiltersRoutes);
  app.use('/api/v1/admin/categories', adminCategoriesRoutes);
  app.use('/api/v1/admin/attributes', adminAttributesRoutes);
  app.use('/api/v1/admin/collections', adminCollectionsRoutes);
  app.use('/api/v1/admin/products', adminProductsRoutes);
  app.use('/api/v1/categories', publicCategoryFiltersRoutes);
  app.use('/api/v1/categories', publicCategoriesRoutes);
  app.use('/api/v1/attributes', publicAttributesRoutes);
  app.use('/api/v1/collections', publicCollectionsRoutes);
  app.use('/api/v1/products', publicProductsRoutes);

  // 4. Fallback 404 Handler for undefined admin endpoints
  app.use('/api/v1/admin/*', (req, res) => {
    return ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
  });

  // 5. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
