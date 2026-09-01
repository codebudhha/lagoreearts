import { hashPassword, comparePassword, signToken } from '../utils/crypto.js';
import { db } from '../db/database.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'customer')
    `).run(name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, passwordHash);

    const newUserId = Number(result.lastInsertRowid);
    const newUser = db.prepare('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?').get(newUserId);
    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    if (res.cookie) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to Lagoree Arts.',
      token,
      user: newUser
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at
    };

    const token = signToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role });

    if (res.cookie) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function getMe(req, res, next) {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
    const defaultAddress = addresses.find(a => a.is_default === 1) || addresses[0] || null;

    const stats = {
      totalOrders: Number(db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id).count),
      wishlistCount: Number(db.prepare('SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?').get(req.user.id).count)
    };

    return res.json({
      success: true,
      user,
      defaultAddress,
      stats
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function updateProfile(req, res, next) {
  try {
    const { name, phone, avatar } = req.body || {};

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          avatar = COALESCE(?, avatar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name ? name.trim() : null, phone ? phone.trim() : null, avatar || null, req.user.id);

    const updatedUser = db.prepare('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const isMatch = comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user.id);

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function getAddresses(req, res, next) {
  try {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
    return res.json({ success: true, addresses });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function addAddress(req, res, next) {
  try {
    const { fullName, phone, street, apartment, city, state, postalCode, country, isDefault } = req.body || {};

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'Please provide all required address fields.' });
    }

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const existingCount = Number(db.prepare('SELECT COUNT(*) as count FROM addresses WHERE user_id = ?').get(req.user.id).count);
    const shouldBeDefault = isDefault || existingCount === 0 ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO addresses (user_id, full_name, phone, street, apartment, city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      fullName.trim(),
      phone.trim(),
      street.trim(),
      apartment ? apartment.trim() : null,
      city.trim(),
      state.trim(),
      postalCode.trim(),
      country || 'India',
      shouldBeDefault
    );

    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, phone, street, apartment, city, state, postalCode, country, isDefault } = req.body || {};

    const existing = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    db.prepare(`
      UPDATE addresses
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          street = COALESCE(?, street),
          apartment = COALESCE(?, apartment),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          postal_code = COALESCE(?, postal_code),
          country = COALESCE(?, country),
          is_default = COALESCE(?, is_default)
      WHERE id = ? AND user_id = ?
    `).run(fullName, phone, street, apartment, city, state, postalCode, country, isDefault ? 1 : 0, id, req.user.id);

    const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: 'Address updated successfully.',
      address: updated
    });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ success: false, message: err.message });
  }
}

export function logout(req, res) {
  if (res.clearCookie) res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully.' });
}
