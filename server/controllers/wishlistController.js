import { db } from '../db/database.js';

export function getWishlist(req, res, next) {
  try {
    const items = db.prepare(`
      SELECT w.id as wishlist_id, w.created_at as saved_at,
             p.*, c.name as category_name, a.name as artist_name,
             COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 5.0) as average_rating
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN artists a ON p.artist_id = a.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id).map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      tags: JSON.parse(p.tags || '[]'),
      is_featured: Boolean(p.is_featured),
      is_antique: Boolean(p.is_antique)
    }));

    return res.json({ success: true, wishlist: items });
  } catch (err) {
    next(err);
  }
}

export function toggleWishlist(req, res, next) {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);

    let isSaved = false;
    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE id = ?').run(existing.id);
      isSaved = false;
    } else {
      db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
      isSaved = true;
    }

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?').get(req.user.id).count;

    return res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Masterpiece added to your private wishlist.' : 'Removed from wishlist.',
      count: totalCount
    });
  } catch (err) {
    next(err);
  }
}

export function moveToCart(req, res, next) {
  try {
    const { productId, framingId, size } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    // Add to cart
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?').run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO cart_items (user_id, product_id, framing_id, size, quantity)
        VALUES (?, ?, ?, ?, 1)
      `).run(req.user.id, productId, framingId || null, size || null);
    }

    // Remove from wishlist
    db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);

    return res.json({
      success: true,
      message: 'Masterpiece moved to your cart.'
    });
  } catch (err) {
    next(err);
  }
}
