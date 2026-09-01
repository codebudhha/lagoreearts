import { db } from '../db/database.js';

export function calculateCartSummary(cartItems, couponCode = null) {
  let subtotal = 0;
  let totalFramingCost = 0;
  const items = [];

  for (const item of cartItems) {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(item.product_id);

    if (!product) continue;

    const basePrice = product.sale_price || product.base_price;
    let unitPrice = basePrice;
    let frameCost = 0;
    let frameOption = null;

    if (item.framing_id) {
      frameOption = db.prepare('SELECT * FROM framing_options WHERE id = ?').get(item.framing_id);
      if (frameOption) {
        frameCost = Math.round((basePrice * (frameOption.price_multiplier - 1)) + frameOption.price_adder);
        unitPrice = basePrice + frameCost;
      }
    }

    const itemTotal = unitPrice * item.quantity;
    subtotal += basePrice * item.quantity;
    totalFramingCost += frameCost * item.quantity;

    const images = JSON.parse(product.images || '[]');

    items.push({
      cartItemId: item.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: images[0] || '',
      categoryName: product.category_name,
      dimensions: item.size || product.dimensions,
      framingId: item.framing_id,
      framingName: frameOption ? frameOption.name : 'Unframed / Rolled Canvas',
      basePrice,
      frameCost,
      unitPrice,
      quantity: item.quantity,
      itemTotal,
      stock: product.stock
    });
  }

  const rawSubtotal = subtotal + totalFramingCost;

  // Coupon discount calculation
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = db.prepare(`
      SELECT * FROM coupons 
      WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `).get(couponCode.toUpperCase().trim());

    if (coupon) {
      if (rawSubtotal >= (coupon.min_order_value || 0)) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.round((rawSubtotal * coupon.discount_value) / 100);
          if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        } else if (coupon.discount_type === 'flat') {
          discountAmount = coupon.discount_value;
        }
        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
          discountAmount
        };
      }
    }
  }

  // Shipping policy: Free shipping on luxury orders over ₹15,000, else ₹1,200 insured white-glove crate
  const taxableSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const shippingFee = rawSubtotal > 15000 || rawSubtotal === 0 ? 0 : 1200;
  const taxAmount = Math.round(taxableSubtotal * 0.12); // 12% GST standard for art & craft in India
  const grandTotal = taxableSubtotal + shippingFee + taxAmount;

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    framingCost: totalFramingCost,
    grossSubtotal: rawSubtotal,
    discountAmount,
    appliedCoupon,
    shippingFee,
    taxAmount,
    grandTotal
  };
}

export function getCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId || null;
    const couponCode = req.query.couponCode || null;

    let cartRows = [];
    if (userId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id DESC').all(userId);
    } else if (sessionId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id DESC').all(sessionId);
    }

    const summary = calculateCartSummary(cartRows, couponCode);

    return res.json({
      success: true,
      cart: summary
    });
  } catch (err) {
    next(err);
  }
}

export function addToCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId || null;
    const { productId, framingId, size, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = db.prepare('SELECT id, stock, title FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Artwork not found.' });
    }

    // Check if item with exact same framing and size already exists in cart
    let existingItem = null;
    if (userId) {
      existingItem = db.prepare(`
        SELECT * FROM cart_items 
        WHERE user_id = ? AND product_id = ? AND COALESCE(framing_id, 0) = COALESCE(?, 0) AND COALESCE(size, '') = COALESCE(?, '')
      `).get(userId, productId, framingId || null, size || null);
    } else if (sessionId) {
      existingItem = db.prepare(`
        SELECT * FROM cart_items 
        WHERE session_id = ? AND product_id = ? AND COALESCE(framing_id, 0) = COALESCE(?, 0) AND COALESCE(size, '') = COALESCE(?, '')
      `).get(sessionId, productId, framingId || null, size || null);
    }

    if (existingItem) {
      const newQty = existingItem.quantity + Number(quantity);
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);
    } else {
      db.prepare(`
        INSERT INTO cart_items (user_id, session_id, product_id, framing_id, size, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, sessionId, productId, framingId || null, size || null, Number(quantity));
    }

    // Return updated cart summary
    let cartRows = [];
    if (userId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id DESC').all(userId);
    } else if (sessionId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id DESC').all(sessionId);
    }

    const summary = calculateCartSummary(cartRows);

    return res.json({
      success: true,
      message: `"${product.title}" added to your curated collection.`,
      cart: summary
    });
  } catch (err) {
    next(err);
  }
}

export function updateCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || null;

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(Number(quantity), id);
    }

    let cartRows = [];
    if (userId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id DESC').all(userId);
    } else if (sessionId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id DESC').all(sessionId);
    }

    const summary = calculateCartSummary(cartRows);

    return res.json({
      success: true,
      message: 'Cart updated.',
      cart: summary
    });
  } catch (err) {
    next(err);
  }
}

export function removeCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || null;

    db.prepare('DELETE FROM cart_items WHERE id = ?').run(id);

    let cartRows = [];
    if (userId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id DESC').all(userId);
    } else if (sessionId) {
      cartRows = db.prepare('SELECT * FROM cart_items WHERE session_id = ? ORDER BY id DESC').all(sessionId);
    }

    const summary = calculateCartSummary(cartRows);

    return res.json({
      success: true,
      message: 'Item removed from your cart.',
      cart: summary
    });
  } catch (err) {
    next(err);
  }
}

export function validateCoupon(req, res, next) {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const coupon = db.prepare(`
      SELECT * FROM coupons 
      WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `).get(code.toUpperCase().trim());

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promotional code.' });
    }

    if (subtotal && subtotal < (coupon.min_order_value || 0)) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum order value of ₹${(coupon.min_order_value).toLocaleString('en-IN')}.`
      });
    }

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        maxDiscount: coupon.max_discount
      }
    });
  } catch (err) {
    next(err);
  }
}
