import crypto from 'crypto';
import { db } from '../db/database.js';
import { calculateCartSummary } from './cartController.js';

export function createOrder(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId || null;
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      paymentMethod = 'upi',
      couponCode,
      notes
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Contact and shipping address details are required.' });
    }

    // 1. Fetch Cart Items
    let cartRows = [];
    if (userId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE user_id = ?').all(userId);
    } else if (sessionId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE session_id = ?').all(sessionId);
    }

    if (!cartRows || cartRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // 2. Calculate summary
    const summary = calculateCartSummary(cartRows, couponCode);
    if (summary.items.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items found in cart.' });
    }

    // 3. Generate unique Order Number
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `LAG-${year}-${randomDigits}`;

    // Estimated delivery in 5 to 7 days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const isCOD = paymentMethod === 'cod';
    const paymentStatus = isCOD ? 'pending' : 'paid'; // Simulated instant clearance for online modes
    const transactionId = isCOD ? null : `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const trackingNumber = `BLUEDART-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 4. Insert Order
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, billing_address, subtotal, frame_cost, discount_amount,
        coupon_code, shipping_fee, tax_amount, total_amount, payment_method,
        payment_status, payment_transaction_id, order_status, tracking_number,
        courier_name, estimated_delivery, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderResult = insertOrderStmt.run(
      orderNumber,
      userId,
      customerName.trim(),
      customerEmail.toLowerCase().trim(),
      customerPhone.trim(),
      typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      typeof billingAddress === 'string' ? billingAddress : JSON.stringify(billingAddress || shippingAddress),
      summary.subtotal,
      summary.framingCost,
      summary.discountAmount,
      couponCode || null,
      summary.shippingFee,
      summary.taxAmount,
      summary.grandTotal,
      paymentMethod,
      paymentStatus,
      transactionId,
      'placed',
      trackingNumber,
      'BlueDart Luxury Secure Logistics',
      estimatedDeliveryStr,
      notes ? notes.trim() : null
    );

    const orderId = orderResult.lastInsertRowid;

    // 5. Insert Order Items & Deduct Stock
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_title, frame_name, size, unit_price, quantity, total_price, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
    `);

    for (const item of summary.items) {
      insertItemStmt.run(
        orderId,
        item.productId,
        item.title,
        item.framingName,
        item.dimensions,
        item.unitPrice,
        item.quantity,
        item.itemTotal,
        item.image
      );

      updateStockStmt.run(item.quantity, item.productId);
    }

    // 6. Record Initial Timeline Events
    const insertTimelineStmt = db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description, timestamp)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertTimelineStmt.run(
      orderId,
      'placed',
      'Order Placed Successfully',
      `Order ${orderNumber} has been received and registered in our heritage registry.`
    );

    if (paymentStatus === 'paid') {
      insertTimelineStmt.run(
        orderId,
        'paid',
        'Payment Verified & Cleared',
        `Transaction ID ${transactionId} confirmed via ${paymentMethod.toUpperCase()}.`
      );
    }

    // 7. Update coupon usage
    if (couponCode) {
      db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE code = ?').run(couponCode.toUpperCase().trim());
    }

    // 8. Clear Cart
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    } else if (sessionId) {
      db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
    }

    return res.status(201).json({
      success: true,
      message: 'Masterpiece acquisition order confirmed.',
      order: {
        id: orderId,
        orderNumber,
        totalAmount: summary.grandTotal,
        paymentMethod,
        paymentStatus,
        transactionId,
        trackingNumber,
        estimatedDelivery: estimatedDeliveryStr
      }
    });
  } catch (err) {
    next(err);
  }
}

export function simulatePaymentVerification(req, res, next) {
  try {
    const { orderNumber, paymentId, status = 'success' } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (status === 'success') {
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'paid',
            payment_transaction_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(paymentId || `SIM-PAY-${Date.now()}`, order.id);

      db.prepare(`
        INSERT INTO order_timeline (order_id, status, title, description)
        VALUES (?, 'paid', 'Payment Verified', 'Electronic transfer cleared through banking partner.')
      `).run(order.id);

      return res.json({ success: true, message: 'Payment successfully captured.' });
    } else {
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.id);

      return res.json({ success: false, message: 'Payment authorization declined.' });
    }
  } catch (err) {
    next(err);
  }
}
