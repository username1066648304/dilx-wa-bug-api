// api/auth.js
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const crypto = require('crypto');

// Fungsi buat token rawak
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Login Endpoint (POST /api/login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Sila isi semua field.' });

  const user = db.get('users').find({ username }).value();
  if (!user) return res.status(404).json({ success: false, message: 'Username tidak wujud.' });
  if (user.password !== password) return res.status(401).json({ success: false, message: 'Password salah.' });

  // Check expired
  const now = Date.now();
  if (user.expiredAt && now > user.expiredAt) {
    return res.status(403).json({ success: false, message: 'Akaun telah tamat tempoh.' });
  }

  // Buat token baru dan simpan
  const token = generateToken();
  db.get('users').find({ username }).assign({ token }).write();

  return res.json({
    success: true,
    message: 'Login berjaya!',
    data: {
      username: user.username,
      role: user.role,
      expiredAt: user.expiredAt,
      token,
    },
  });
});

// Token Validator (GET /api/validate?token=xxxx)
router.get('/validate', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, reason: 'Token kosong' });

  const user = db.get('users').find({ token }).value();
  if (!user) return res.status(401).json({ valid: false, reason: 'Token tidak sah' });

  const now = Date.now();
  if (user.expiredAt && now > user.expiredAt) {
    return res.status(403).json({ valid: false, reason: 'Akaun tamat tempoh' });
  }

  res.json({
    valid: true,
    username: user.username,
    role: user.role,
    expiredAt: user.expiredAt,
  });
});

module.exports = router;
