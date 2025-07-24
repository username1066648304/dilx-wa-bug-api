const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '../database/users.json');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  if (user.expired && Date.now() > user.expired) {
    return res.status(403).json({ message: 'Account expired.' });
  }

  res.json({ token: user.username, role: user.role });
});

module.exports = router;
