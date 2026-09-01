import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db/database.js';
import { authenticateToken, optionalAuthenticate, requireAdmin } from './middleware/auth.js';

// Controllers
import * as authController from './controllers/authController.js';
import * as productController from './controllers/productController.js';
import * as cartController from './controllers/cartController.js';
import * as checkoutController from './controllers/checkoutController.js';
import * as orderController from './controllers/orderController.js';
import * as wishlistController from './controllers/wishlistController.js';
import * as adminController from './controllers/adminController.js';
import * as contactController from './controllers/contactController.js';

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (e) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize database schema
initDatabase();

const PORT = parseInt(process.env.PORT || '5000', 10);

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Clean Page Map
const pageMap = {
  '/': 'Lagoree Homepage.html',
  '/home': 'Lagoree Homepage.html',
  '/category': 'Lagoree Category.html',
  '/catalog': 'Lagoree Category.html',
  '/product': 'Lagoree_Product Claude.html',
  '/cart': 'Lagoree_Cart claude.html',
  '/checkout': 'Checkout - Lagoree Arts.html',
  '/order-confirmation': 'Order Confirmation - Lagoree Arts.html',
  '/order-detail': 'Order Detail - Lagoree Arts.html',
  '/account': 'My Account Lagoree Arts.html',
  '/my-account': 'My Account Lagoree Arts.html',
  '/login': 'Login-Register - Lagoree Arts.html',
  '/register': 'Login-Register - Lagoree Arts.html',
  '/wishlist': 'Wishlist - Lagoree Arts.html',
  '/antiques': 'Antiques - Lagoree Arts.html',
  '/artist': 'Artist - Lagoree Arts.html',
  '/lookbook': 'Lookbook - Lagoree Arts.html',
  '/journal': 'Journal - Lagoree Arts.html',
  '/journal-article': 'Journal Article - Lagoree Arts.html',
  '/about': 'About - Lagoree Arts.html',
  '/contact': 'Contact - Lagoree Arts.html',
  '/faq': 'FAQ - Lagoree Arts.html',
  '/search': 'Search - Lagoree Arts.html',
  '/gift': 'Gift - Lagoree Arts.html',
  '/privacy': 'Privacy - Lagoree Arts.html',
  '/returns': 'Returns - Lagoree Arts.html',
  '/shipping': 'Shipping - Lagoree Arts.html',
  '/terms': 'Terms - Lagoree Arts.html',
  '/coming-soon': 'Coming Soon - Lagoree Arts.html'
};

// Request Body Parser Helper
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        try {
          const params = new URLSearchParams(body);
          const obj = {};
          for (const [k, v] of params.entries()) obj[k] = v;
          resolve(obj);
        } catch (err) {
          resolve({});
        }
      }
    });
  });
}

// Cookie Parser Helper
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Static File Server Helper
function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFoundPath = path.join(rootDir, '404 - Lagoree Arts.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Enhance Request & Response
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.cookies = parseCookies(req.headers.cookie);
  req.params = {};

  res.status = function(code) {
    this.statusCode = code;
    return this;
  };

  res.json = function(data, statusCode = this.statusCode || 200) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });
    res.end(JSON.stringify(data));
  };

  res.cookie = function(name, val, options = {}) {
    let cookieStr = `${name}=${encodeURIComponent(val)}; Path=/; SameSite=Lax`;
    if (options.maxAge) cookieStr += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
    if (options.httpOnly) cookieStr += '; HttpOnly';
    res.setHeader('Set-Cookie', cookieStr);
  };

  res.clearCookie = function(name) {
    res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  };

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  // Parse Body for non-GET/HEAD
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    req.body = await parseBody(req);
  }

  // ----------------------------------------------------
  // API ROUTER
  // ----------------------------------------------------
  if (pathname.startsWith('/api/')) {
    const method = req.method;

    // Health
    if (pathname === '/api/health' && method === 'GET') {
      return res.json({
        status: 'online',
        brand: 'Lagoree Arts Luxury E-Commerce API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // AUTH
    if (pathname === '/api/auth/register' && method === 'POST') return authController.register(req, res);
    if (pathname === '/api/auth/login' && method === 'POST') return authController.login(req, res);
    if (pathname === '/api/auth/logout' && method === 'POST') return authController.logout(req, res);
    
    if (pathname === '/api/auth/me' && method === 'GET') {
      return authenticateToken(req, res, () => authController.getMe(req, res));
    }
    if (pathname === '/api/auth/profile' && method === 'PUT') {
      return authenticateToken(req, res, () => authController.updateProfile(req, res));
    }
    if (pathname === '/api/auth/change-password' && method === 'PUT') {
      return authenticateToken(req, res, () => authController.changePassword(req, res));
    }
    if (pathname === '/api/auth/addresses' && method === 'GET') {
      return authenticateToken(req, res, () => authController.getAddresses(req, res));
    }
    if (pathname === '/api/auth/addresses' && method === 'POST') {
      return authenticateToken(req, res, () => authController.addAddress(req, res));
    }
    if (pathname.startsWith('/api/auth/addresses/') && method === 'PUT') {
      req.params.id = pathname.split('/').pop();
      return authenticateToken(req, res, () => authController.updateAddress(req, res));
    }
    if (pathname.startsWith('/api/auth/addresses/') && method === 'DELETE') {
      req.params.id = pathname.split('/').pop();
      return authenticateToken(req, res, () => authController.deleteAddress(req, res));
    }

    // PRODUCTS
    if (pathname === '/api/products' && method === 'GET') return productController.getProducts(req, res);
    if (pathname === '/api/products/categories' && method === 'GET') return productController.getCategories(req, res);
    if (pathname === '/api/products/artists' && method === 'GET') return productController.getArtists(req, res);
    if (pathname === '/api/products/framing-options' && method === 'GET') return productController.getFramingOptions(req, res);
    
    const reviewMatch = pathname.match(/^\/api\/products\/(\d+)\/reviews$/);
    if (reviewMatch && method === 'POST') {
      req.params.productId = reviewMatch[1];
      return optionalAuthenticate(req, res, () => productController.addReview(req, res));
    }

    if (pathname.startsWith('/api/products/') && method === 'GET') {
      req.params.identifier = pathname.replace('/api/products/', '');
      return productController.getProductBySlugOrId(req, res);
    }

    // CART
    if (pathname === '/api/cart' && method === 'GET') {
      return optionalAuthenticate(req, res, () => cartController.getCart(req, res));
    }
    if (pathname === '/api/cart/add' && method === 'POST') {
      return optionalAuthenticate(req, res, () => cartController.addToCart(req, res));
    }
    if (pathname.startsWith('/api/cart/items/') && method === 'PUT') {
      req.params.id = pathname.split('/').pop();
      return optionalAuthenticate(req, res, () => cartController.updateCartItem(req, res));
    }
    if (pathname.startsWith('/api/cart/items/') && method === 'DELETE') {
      req.params.id = pathname.split('/').pop();
      return optionalAuthenticate(req, res, () => cartController.removeCartItem(req, res));
    }
    if (pathname === '/api/cart/coupon' && method === 'POST') {
      return cartController.validateCoupon(req, res);
    }

    // CHECKOUT
    if (pathname === '/api/checkout/create-order' && method === 'POST') {
      return optionalAuthenticate(req, res, () => checkoutController.createOrder(req, res));
    }
    if (pathname === '/api/checkout/verify-payment' && method === 'POST') {
      return checkoutController.simulatePaymentVerification(req, res);
    }

    // ORDERS
    if (pathname === '/api/orders/my-orders' && method === 'GET') {
      return authenticateToken(req, res, () => orderController.getMyOrders(req, res));
    }
    if (pathname.startsWith('/api/orders/') && method === 'GET') {
      req.params.identifier = pathname.replace('/api/orders/', '');
      return optionalAuthenticate(req, res, () => orderController.getOrderDetail(req, res));
    }

    // WISHLIST
    if (pathname === '/api/wishlist' && method === 'GET') {
      return authenticateToken(req, res, () => wishlistController.getWishlist(req, res));
    }
    if (pathname === '/api/wishlist/toggle' && method === 'POST') {
      return authenticateToken(req, res, () => wishlistController.toggleWishlist(req, res));
    }
    if (pathname === '/api/wishlist/move-to-cart' && method === 'POST') {
      return authenticateToken(req, res, () => wishlistController.moveToCart(req, res));
    }

    // ADMIN
    if (pathname === '/api/admin/metrics' && method === 'GET') {
      return authenticateToken(req, res, () => requireAdmin(req, res, () => adminController.getAdminMetrics(req, res)));
    }
    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/status') && method === 'PUT') {
      req.params.id = pathname.split('/')[4];
      return authenticateToken(req, res, () => requireAdmin(req, res, () => adminController.updateOrderStatus(req, res)));
    }
    if (pathname === '/api/admin/products' && method === 'POST') {
      return authenticateToken(req, res, () => requireAdmin(req, res, () => adminController.createProduct(req, res)));
    }
    if (pathname.startsWith('/api/admin/products/') && method === 'PUT') {
      req.params.id = pathname.split('/').pop();
      return authenticateToken(req, res, () => requireAdmin(req, res, () => adminController.updateProduct(req, res)));
    }
    if (pathname.startsWith('/api/admin/products/') && method === 'DELETE') {
      req.params.id = pathname.split('/').pop();
      return authenticateToken(req, res, () => requireAdmin(req, res, () => adminController.deleteProduct(req, res)));
    }

    // CONTACT & NEWSLETTER
    if (pathname === '/api/contact/message' && method === 'POST') return contactController.submitContact(req, res);
    if (pathname === '/api/contact/newsletter' && method === 'POST') return contactController.subscribeNewsletter(req, res);

    return res.status(404).json({ success: false, message: `API endpoint ${pathname} not found.` });
  }

  // ----------------------------------------------------
  // CLEAN HTML ROUTES & STATIC FILES
  // ----------------------------------------------------
  const cleanRoute = pageMap[pathname.toLowerCase()];
  if (cleanRoute) {
    const htmlFile = path.join(rootDir, cleanRoute);
    return serveStaticFile(htmlFile, res);
  }

  // Direct file serving from root (e.g. /assets/js/api.js, /404.html, etc.)
  const directPath = path.join(rootDir, pathname.replace(/^\//, ''));
  return serveStaticFile(directPath, res);
});

server.listen(PORT, () => {
  console.log(`✨ Lagoree Arts Luxury E-Commerce Server running on http://localhost:${PORT}`);
  console.log(`🏛️  API Health: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Storefront: http://localhost:${PORT}/`);
});

export default server;
