import { verifyToken, JWT_SECRET } from '../utils/crypto.js';
import { db } from '../db/database.js';

export function authenticateToken(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    const user = db.prepare('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    if (typeof next === 'function') next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

export function optionalAuthenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = verifyToken(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const user = db.prepare('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?').get(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    } catch (err) {}
  }

  if (typeof next === 'function') next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Curator Admin privileges required.' });
  }
  if (typeof next === 'function') next();
}
