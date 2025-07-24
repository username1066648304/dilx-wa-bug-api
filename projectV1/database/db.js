// database/db.js
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

// 🟢 Load semua user
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// 🔵 Simpan balik semua user
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 🔍 Cari user ikut username
function findUser(username) {
  const users = loadUsers();
  return users.find(u => u.username === username);
}

// ➕ Tambah user baru
function addUser(user) {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

// ❌ Padam user ikut username
function deleteUser(username) {
  const users = loadUsers().filter(u => u.username !== username);
  saveUsers(users);
}

// 🕒 Check expired
function isExpired(user) {
  if (!user.expiredAt) return false;
  return new Date(user.expiredAt) < new Date();
}

module.exports = {
  loadUsers,
  saveUsers,
  findUser,
  addUser,
  deleteUser,
  isExpired
};
