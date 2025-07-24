// index.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Import route dan DB
const authRoutes = require('./api/auth');
const { loadUsers, addUser, deleteUser, findUser } = require('./database/db');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));

// API route
app.use('/api', authRoutes);

// Web pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'web/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'web/dashboard.html')));
app.get('/create-user', (req, res) => res.sendFile(path.join(__dirname, 'web/create-user.html')));
app.get('/trigger', (req, res) => res.sendFile(path.join(__dirname, 'web/trigger.html')));
app.get('/pairing', (req, res) => res.sendFile(path.join(__dirname, 'web/pairing.html')));

// API: Tambah user baru
app.post('/api/create-user', (req, res) => {
  const { username, password, role, duration } = req.body;

  if (findUser(username)) {
    return res.status(400).json({ success: false, message: 'User sudah wujud' });
  }

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + parseInt(duration));

  const user = { username, password, role, expiredAt: expiredAt.toISOString() };
  addUser(user);

  res.json({ success: true, message: 'User berjaya ditambah' });
});

// API: Padam user
app.post('/api/delete-user', (req, res) => {
  const { username } = req.body;

  if (!findUser(username)) {
    return res.status(404).json({ success: false, message: 'User tidak dijumpai' });
  }

  deleteUser(username);
  res.json({ success: true, message: 'User berjaya dipadam' });
});

// API: Senarai user
app.get('/api/list-user', (req, res) => {
  const users = loadUsers().map(u => ({
    username: u.username,
    role: u.role,
    expiredAt: u.expiredAt
  }));
  res.json({ success: true, users });
});

// Run server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
