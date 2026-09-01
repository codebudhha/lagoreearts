import { db } from '../db/database.js';

export function getProducts(req, res, next) {
  try {
    const {
      category,
      artist,
      minPrice,
      maxPrice,
      orientation,
      medium,
      featured,
      antique,
      q,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    let query = `
      SELECT p.*, 
             c.name as category_name, c.slug as category_slug,
             a.name as artist_name, a.slug as artist_slug, a.lineage as artist_lineage,
             COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 5.0) as average_rating,
             (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN artists a ON p.artist_id = a.id
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (artist) {
      query += ` AND (a.slug = ? OR a.id = ?)`;
      params.push(artist, artist);
    }

    if (minPrice) {
      query += ` AND COALESCE(p.sale_price, p.base_price) >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND COALESCE(p.sale_price, p.base_price) <= ?`;
      params.push(Number(maxPrice));
    }

    if (orientation) {
      query += ` AND p.orientation = ?`;
      params.push(orientation.toLowerCase());
    }

    if (medium) {
      query += ` AND p.medium LIKE ?`;
      params.push(`%${medium}%`);
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND p.is_featured = 1`;
    }

    if (antique === 'true' || antique === '1') {
      query += ` AND p.is_antique = 1`;
    }

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      query += ` AND (
        p.title LIKE ? OR 
        p.description LIKE ? OR 
        p.tags LIKE ? OR 
        c.name LIKE ? OR 
        a.name LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY COALESCE(p.sale_price, p.base_price) ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY COALESCE(p.sale_price, p.base_price) DESC`;
        break;
      case 'rating':
        query += ` ORDER BY average_rating DESC, review_count DESC`;
        break;
      case 'featured':
        query += ` ORDER BY p.is_featured DESC, p.id DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.created_at DESC, p.id DESC`;
        break;
    }

    // Get total count before pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const products = db.prepare(query).all(...params).map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      tags: JSON.parse(p.tags || '[]'),
      is_featured: Boolean(p.is_featured),
      is_antique: Boolean(p.is_antique)
    }));

    return res.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getProductBySlugOrId(req, res, next) {
  try {
    const { identifier } = req.params;

    const product = db.prepare(`
      SELECT p.*, 
             c.name as category_name, c.slug as category_slug,
             a.name as artist_name, a.slug as artist_slug, a.lineage as artist_lineage, a.bio as artist_bio, a.avatar as artist_avatar,
             COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 5.0) as average_rating,
             (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN artists a ON p.artist_id = a.id
      WHERE p.slug = ? OR p.id = ?
    `).get(identifier, identifier);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Masterpiece not found.' });
    }

    product.images = JSON.parse(product.images || '[]');
    product.tags = JSON.parse(product.tags || '[]');
    product.is_featured = Boolean(product.is_featured);
    product.is_antique = Boolean(product.is_antique);

    // Fetch framing options
    const framingOptions = db.prepare('SELECT * FROM framing_options ORDER BY id ASC').all();

    // Fetch reviews
    const reviews = db.prepare(`
      SELECT r.*, u.avatar as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(product.id);

    // Fetch related products
    const related = db.prepare(`
      SELECT p.*, c.name as category_name, a.name as artist_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN artists a ON p.artist_id = a.id
      WHERE (p.category_id = ? OR p.artist_id = ?) AND p.id != ?
      LIMIT 4
    `).all(product.category_id, product.artist_id, product.id).map(r => ({
      ...r,
      images: JSON.parse(r.images || '[]')
    }));

    return res.json({
      success: true,
      product,
      framingOptions,
      reviews,
      related
    });
  } catch (err) {
    next(err);
  }
}

export function getCategories(req, res, next) {
  try {
    const categories = db.prepare(`
      SELECT c.*, (SELECT COUNT(p.id) FROM products p WHERE p.category_id = c.id) as product_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.id ASC
    `).all();

    return res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

export function getArtists(req, res, next) {
  try {
    const artists = db.prepare(`
      SELECT a.*, (SELECT COUNT(p.id) FROM products p WHERE p.artist_id = a.id) as product_count
      FROM artists a
      ORDER BY a.is_master DESC, a.id ASC
    `).all();

    return res.json({ success: true, artists });
  } catch (err) {
    next(err);
  }
}

export function getFramingOptions(req, res, next) {
  try {
    const options = db.prepare('SELECT * FROM framing_options ORDER BY id ASC').all();
    return res.json({ success: true, framingOptions: options });
  } catch (err) {
    next(err);
  }
}

export function addReview(req, res, next) {
  try {
    const { productId } = req.params;
    const { rating, title, comment, userName } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and review comment are required.' });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const authorName = req.user ? req.user.name : (userName || 'Connoisseur Collector');
    const userId = req.user ? req.user.id : null;

    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, verified_purchase)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(productId, userId, authorName, Number(rating), title || null, comment.trim());

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your refined review.',
      review
    });
  } catch (err) {
    next(err);
  }
}
