// api/auth.js
const express = require('express');
const router = express.Router();
const { findUser, isExpired } = require('../database/db');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = findUser(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (isExpired(user)) {
    return res.status(403).json({ success: false, message: 'Akaun sudah tamat tempoh' });
  }

  res.json({
    success: true,
    username: user.username,
    role: user.role,
    expiredAt: user.expiredAt
  });
});

module.exports = router;
