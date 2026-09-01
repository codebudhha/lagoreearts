import { db } from '../db/database.js';

export function submitContact(req, res, next) {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    db.prepare(`
      INSERT INTO contact_messages (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim(), phone ? phone.trim() : null, subject ? subject.trim() : 'Art Advisory Concierge', message.trim());

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Lagoree Arts. Our curator advisory team will respond within 24 hours.'
    });
  } catch (err) {
    next(err);
  }
}

export function subscribeNewsletter(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.json({ success: true, message: 'You are already subscribed to Lagoree Arts Gazette.' });
    }

    db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(email.toLowerCase().trim());

    return res.status(201).json({
      success: true,
      message: 'Welcome to the Lagoree Arts Private Circle. Enjoy curated drops and heritage insights.'
    });
  } catch (err) {
    next(err);
  }
}
