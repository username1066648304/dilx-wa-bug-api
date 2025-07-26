// System Variables
const BIN_ID = "688384cdae596e708fbb97e4";
const API_KEY = "$2a$10$55IAjRl7i3QlilxdTPmqx.5/Idiemz453V9zHKc76Z9q4jDPhvL.C";
const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY
};

// DOM Elements
const elements = {
  popup: document.getElementById("popup"),
  popupMessage: document.getElementById("popup-message"),
  loginBox: document.getElementById("login-box"),
  mainBox: document.getElementById("main-box"),
  profileDropdown: document.getElementById("profileDropdown")
};

// State Management
let currentRole = '';
let selectedRole = 'admin';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  particlesJS("particles-js", {
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 }},
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.3 },
      size: { value: 3, random: true },
      line_linked: {
        enable: true, distance: 150,
        color: "#ffffff", opacity: 0.2, width: 1
      },
      move: { enable: true, speed: 2 }
    },
    interactivity: {
      events: { onhover: { enable: true, mode: "grab" }},
      modes: { grab: { distance: 200, line_linked: { opacity: 1 }}}
    },
    retina_detect: true
  });

  // Check session on load
  const user = getSession();
  if (user) showDashboard(user);

  // Event listeners
  document.querySelector('.hamburger-menu').addEventListener('click', toggleSideMenu);
  document.querySelector('.profile-icon').addEventListener('click', toggleProfileDropdown);
  window.addEventListener('click', closeAllDropdowns);
});

// Core Functions
async function getUsers() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers });
  const data = await res.json();
  return data.record;
}

function saveSession(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}

function getSession() {
  return JSON.parse(sessionStorage.getItem("currentUser"));
}

function logout() {
  sessionStorage.removeItem("currentUser");
  location.reload();
}

// UI Functions
function showPopup(message, isSuccess = false) {
  const popup = elements.popup;
  const content = popup.querySelector(".popup-content");
  
  elements.popupMessage.innerHTML = message;
  popup.style.display = "flex";

  if (isSuccess) {
    content.classList.add("success");
  } else {
    content.classList.remove("success");
  }
}

function closePopup() {
  elements.popup.style.display = "none";
}

function showDashboard(user) {
  elements.loginBox.style.display = "none";
  elements.mainBox.style.display = "block";
  document.getElementById("userLabel").innerText = user.username;
  document.getElementById("welcomeText").innerText = `Welcome, ${user.username}\nExpired: ${new Date(user.expired).toLocaleDateString()}`;
  
  // Update UI based on role
  updateProfileDropdown(user.role || 'user');
  checkServerStatus();
  setInterval(checkServerStatus, 3000);
}

// Role Management
function updateProfileDropdown(role) {
  currentRole = role;
  let menuItems = '';

  if (role === 'admin') {
    menuItems = `
      <a href="#" onclick="showRoleMenu('admin')"><i class="fas fa-user-shield"></i> Admin</a>
      <a href="#" onclick="showRoleMenu('reseller')"><i class="fas fa-user-tag"></i> Reseller</a>
      <a href="#" onclick="showRoleMenu('account')"><i class="fas fa-user-cog"></i> Account</a>
    `;
  } else if (role === 'reseller') {
    menuItems = `
      <a href="#" onclick="showRoleMenu('reseller')"><i class="fas fa-user-tag"></i> Reseller</a>
      <a href="#" onclick="showRoleMenu('account')"><i class="fas fa-user-cog"></i> Account</a>
    `;
  } else {
    menuItems = `
      <a href="#" onclick="showRoleMenu('account')"><i class="fas fa-user-cog"></i> Account</a>
    `;
  }

  elements.profileDropdown.innerHTML = menuItems;
}

function showRoleMenu(menuType) {
  const user = getSession();
  if (!user) return;
  
  // Validate role access
  if (menuType === 'admin' && user.role !== 'admin') {
    showPopup("⚠️ Akses ditolak! Hanya untuk Admin.");
    return;
  }
  
  if (menuType === 'reseller' && !['admin', 'reseller'].includes(user.role)) {
    showPopup("⚠️ Akses ditolak! Hanya untuk Admin/Reseller.");
    return;
  }
  
  // Hide all menus
  document.querySelectorAll('.role-menu').forEach(menu => {
    menu.style.display = 'none';
  });
  
  // Show selected menu
  if (menuType === 'admin') {
    document.getElementById('adminMenu').style.display = 'block';
    openRoleTab('createUser');
  } else if (menuType === 'reseller') {
    document.getElementById('resellerMenu').style.display = 'block';
  } else if (menuType === 'account') {
    document.getElementById('accountMenu').style.display = 'block';
  }
}

function openRoleTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.role-tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab and set active
  document.getElementById(tabName).style.display = 'block';
  event.currentTarget.classList.add('active');
}

function selectRole(element, role) {
  // Remove active class from all options
  document.querySelectorAll('.role-option').forEach(opt => {
    opt.classList.remove('active');
  });
  
  // Add active class to selected
  element.classList.add('active');
  selectedRole = role;
}

// Menu Interactions
function toggleSideMenu() {
  // Implement if you want side menu
  console.log("Hamburger menu clicked");
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  elements.profileDropdown.classList.toggle('show');
}

function closeAllDropdowns(e) {
  if (!e.target.matches('.profile-icon') && !e.target.matches('.profile-icon *')) {
    elements.profileDropdown.classList.remove('show');
  }
}

// [Rest of your existing functions (login, sendBug, etc.)]
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const result = document.getElementById("login-result");

  const users = await getUsers();
  const found = users.find(u => u.username === username && u.password === password);

  if (!found) {
    result.innerText = "❌ Username atau Password salah!";
    result.style.color = "crimson";
    return;
  }

  if (found.banned === true) {
    result.innerText = "🚫 Akun ini telah dibanned!";
    result.style.color = "orangered";
    return;
  }

  // Check expired
  const now = new Date();
  const expiredDate = new Date(found.expired);
  if (now > expiredDate) {
    result.innerText = "❌ Akun sudah expired!";
    result.style.color = "crimson";
    return;
  }

  // Set default role if not exists
  found.role = found.role || 'user';
  saveSession(found);
  showDashboard(found);
}

// [Implement other CRUD functions for admin/reseller/account here]
async function createUser() {
  const user = getSession();
  if (user.role !== 'admin') {
    showPopup("⚠️ Hanya Admin yang bisa membuat user!");
    return;
  }
  
  // Implement create user logic
  showPopup("Fitur create user akan diimplementasikan", true);
}

async function resellerCreateUser() {
  // Implement reseller create user logic
  showPopup("Fitur reseller create user akan diimplementasikan", true);
}

// [Add other necessary functions]
async function checkServerStatus() {
  const statusEl = document.querySelector(".status");
  try {
    const res = await fetch("https://cella-why.mydigital-store.me/status");
    const data = await res.json();
    if (data.connected) {
      statusEl.innerHTML = `<i class="fas fa-circle" style="color:limegreen;"></i> Connected`;
    } else {
      statusEl.innerHTML = `<i class="fas fa-circle" style="color:gray;"></i> Disconnected`;
    }
  } catch (err) {
    statusEl.innerHTML = `<i class="fas fa-circle" style="color:gray;"></i> Disconnected`;
  }
}