import { db } from '../db/database.js';

export function getMyOrders(req, res, next) {
  try {
    const orders = db.prepare(`
      SELECT o.*,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
             (SELECT oi.image FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) as first_item_image,
             (SELECT oi.product_title FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) as first_item_title
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const formatted = orders.map(o => ({
      ...o,
      shipping_address: JSON.parse(o.shipping_address || '{}'),
      billing_address: JSON.parse(o.billing_address || '{}')
    }));

    return res.json({ success: true, orders: formatted });
  } catch (err) {
    next(err);
  }
}

export function getOrderDetail(req, res, next) {
  try {
    const { identifier } = req.params;
    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && req.user.role === 'admin';

    let order = db.prepare(`
      SELECT o.* 
      FROM orders o 
      WHERE o.order_number = ? OR o.id = ?
    `).get(identifier, identifier);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: Customer can only view their own order unless accessed via guest order number or admin
    if (order.user_id && userId && order.user_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const timeline = db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC').all(order.id);

    return res.json({
      success: true,
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address || '{}'),
        billing_address: JSON.parse(order.billing_address || '{}'),
        items,
        timeline
      }
    });
  } catch (err) {
    next(err);
  }
}
