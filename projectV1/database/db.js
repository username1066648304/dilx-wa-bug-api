// database/db.js

const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'users.json');

function loadUsers() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function findUser(username) {
    const users = loadUsers();
    return users.find(user => user.username === username);
}

function addUser({ username, password, role, expires }) {
    const users = loadUsers();
    users.push({ username, password, role, expires, device: null });
    saveUsers(users);
}

function deleteUser(username) {
    let users = loadUsers();
    users = users.filter(user => user.username !== username);
    saveUsers(users);
}

function updateDevice(username, deviceId) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    if (user) {
        user.device = deviceId;
        saveUsers(users);
    }
}

function isExpired(user) {
    const now = Date.now();
    return now > new Date(user.expires).getTime();
}

module.exports = {
    loadUsers,
    saveUsers,
    findUser,
    addUser,
    deleteUser,
    updateDevice,
    isExpired
};
