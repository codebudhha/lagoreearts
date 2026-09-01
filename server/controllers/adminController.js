import { db } from '../db/database.js';

export function getAdminMetrics(req, res, next) {
  try {
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'
    `).get().total;

    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_status IN ('placed', 'framing', 'packed')`).get().count;
    const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'customer'`).get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const lowStockAlerts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= 1').get().count;

    const recentOrders = db.prepare(`
      SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.order_status, o.payment_status, o.created_at,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 8
    `).all();

    return res.json({
      success: true,
      metrics: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        lowStockAlerts
      },
      recentOrders
    });
  } catch (err) {
    next(err);
  }
}

export function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, title, description, trackingNumber, courierName } = req.body;

    const validStatuses = ['placed', 'framing', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    db.prepare(`
      UPDATE orders 
      SET order_status = ?,
          tracking_number = COALESCE(?, tracking_number),
          courier_name = COALESCE(?, courier_name),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, trackingNumber || null, courierName || null, id);

    // Add tracking timeline event
    const statusTitles = {
      placed: 'Order Placed & Registered',
      framing: 'Custom Archival Framing in Atelier',
      packed: 'Museum Inspection & Crated',
      shipped: 'Dispatched with White-Glove Courier',
      delivered: 'Delivered to Collector Sanctuary',
      cancelled: 'Order Cancelled'
    };

    db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description)
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      status,
      title || statusTitles[status],
      description || `Order status updated to ${status.toUpperCase()} by Lagoree Arts atelier.`
    );

    return res.json({
      success: true,
      message: `Order #${order.order_number} status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
}

export function createProduct(req, res, next) {
  try {
    const {
      title,
      slug,
      sku,
      categoryId,
      artistId,
      description,
      provenance,
      dimensions,
      medium,
      orientation = 'portrait',
      basePrice,
      salePrice,
      stock = 1,
      isFeatured = 0,
      isAntique = 0,
      certificateDetails,
      images = [],
      tags = []
    } = req.body;

    if (!title || !basePrice || !dimensions || !medium) {
      return res.status(400).json({ success: false, message: 'Title, base price, dimensions, and medium are required.' });
    }

    const productSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const productSku = sku || `LAG-${Date.now().toString().slice(-6)}`;

    const result = db.prepare(`
      INSERT INTO products (
        title, slug, sku, category_id, artist_id, description, provenance, dimensions,
        medium, orientation, base_price, sale_price, stock, is_featured, is_antique,
        certificate_details, images, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      productSlug,
      productSku,
      categoryId || null,
      artistId || null,
      description || '',
      provenance || null,
      dimensions.trim(),
      medium.trim(),
      orientation,
      Number(basePrice),
      salePrice ? Number(salePrice) : null,
      Number(stock),
      isFeatured ? 1 : 0,
      isAntique ? 1 : 0,
      certificateDetails || null,
      JSON.stringify(images),
      JSON.stringify(tags)
    );

    return res.status(201).json({
      success: true,
      message: 'Masterpiece added to catalog.',
      id: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
}

export function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      categoryId,
      artistId,
      description,
      provenance,
      dimensions,
      medium,
      orientation,
      basePrice,
      salePrice,
      stock,
      isFeatured,
      isAntique,
      certificateDetails,
      images,
      tags
    } = req.body;

    db.prepare(`
      UPDATE products 
      SET title = COALESCE(?, title),
          category_id = COALESCE(?, category_id),
          artist_id = COALESCE(?, artist_id),
          description = COALESCE(?, description),
          provenance = COALESCE(?, provenance),
          dimensions = COALESCE(?, dimensions),
          medium = COALESCE(?, medium),
          orientation = COALESCE(?, orientation),
          base_price = COALESCE(?, base_price),
          sale_price = ?,
          stock = COALESCE(?, stock),
          is_featured = COALESCE(?, is_featured),
          is_antique = COALESCE(?, is_antique),
          certificate_details = COALESCE(?, certificate_details),
          images = COALESCE(?, images),
          tags = COALESCE(?, tags)
      WHERE id = ?
    `).run(
      title,
      categoryId,
      artistId,
      description,
      provenance,
      dimensions,
      medium,
      orientation,
      basePrice ? Number(basePrice) : null,
      salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : null,
      stock !== undefined ? Number(stock) : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      isAntique !== undefined ? (isAntique ? 1 : 0) : null,
      certificateDetails,
      images ? JSON.stringify(images) : null,
      tags ? JSON.stringify(tags) : null,
      id
    );

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
