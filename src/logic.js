const fs = require('fs');
const path = require('path');
const { delay } = require('@whiskeysockets/baileys');
const config = require('./config');

// Pairing code storage and management
const pairingCodes = {};

/**
 * Generate a random 6-digit pairing code
 * @returns {string} 6-digit code
 */
function generatePairingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Handle WhatsApp number pairing process
 * @param {string} number - WhatsApp number (62xxx format)
 * @param {string} username - UltraXweb username
 * @param {string} deviceId - User's device ID
 * @param {object} sock - Baileys WhatsApp socket
 * @param {object} codes - Pairing codes storage
 * @returns {Promise<object>} Pairing result
 */
async function handlePairing(number, username, deviceId, sock, codes) {
  try {
    // Validate number format
    if (!number.startsWith('62') || number.length < 10) {
      throw new Error('Invalid Indonesian WhatsApp number format');
    }

    // Generate pairing code
    const code = generatePairingCode();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiration

    // Store pairing data
    codes[code] = {
      number,
      username,
      deviceId,
      expiresAt,
      paired: false,
      timestamp: new Date().toISOString()
    };

    // Send WhatsApp message with pairing code
    const message = `Your UltraXweb pairing code is: ${code}\n\n` +
                   `This code will expire in 10 minutes. Do not share it with anyone.`;

    await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });

    // Return pairing data (excluding sensitive info)
    return {
      success: true,
      code,
      expiresAt,
      telegram_id: `${number}@s.whatsapp.net`
    };
  } catch (error) {
    console.error('Pairing error:', error);
    throw new Error(`Failed to initiate pairing: ${error.message}`);
  }
}

/**
 * Clean up expired pairing codes
 * @param {object} codes - Pairing codes storage
 */
function cleanupPairingCodes(codes) {
  const now = Date.now();
  let count = 0;

  for (const code in codes) {
    if (codes[code].expiresAt < now) {
      delete codes[code];
      count++;
    }
  }

  if (count > 0) {
    console.log(`Cleaned up ${count} expired pairing codes`);
  }
}

/**
 * Verify and complete pairing process
 * @param {string} code - 6-digit pairing code
 * @param {object} codes - Pairing codes storage
 * @returns {Promise<object>} Pairing verification result
 */
async function verifyPairing(code, codes) {
  try {
    if (!codes[code]) {
      throw new Error('Invalid pairing code');
    }

    const pairingData = codes[code];

    // Check if code expired
    if (pairingData.expiresAt < Date.now()) {
      delete codes[code];
      throw new Error('Pairing code expired');
    }

    // Mark as paired
    pairingData.paired = true;
    pairingData.pairedAt = new Date().toISOString();

    // Save credentials to user directory
    const userCredsDir = path.join(__dirname, 'creds', pairingData.username);
    if (!fs.existsSync(userCredsDir)) {
      fs.mkdirSync(userCredsDir, { recursive: true });
    }

    // In a real implementation, you would save actual WhatsApp credentials
    const creds = {
      number: pairingData.number,
      pairedAt: pairingData.pairedAt,
      deviceId: pairingData.deviceId
    };

    fs.writeFileSync(
      path.join(userCredsDir, 'creds.json'),
      JSON.stringify(creds, null, 2)
    );

    // Generate API token
    const token = generateToken();

    return {
      success: true,
      paired: true,
      token,
      expiresAt: pairingData.expiresAt
    };
  } catch (error) {
    console.error('Pairing verification error:', error);
    throw error;
  }
}

/**
 * Generate a secure API token
 * @returns {string} Generated token
 */
function generateToken() {
  const crypto = require('crypto');
  return 't-' + crypto.randomBytes(16).toString('hex');
}

/**
 * Validate user API token
 * @param {string} token - API token to validate
 * @param {string} username - Associated username
 * @returns {boolean} Validation result
 */
function validateToken(token, username) {
  try {
    // In a real implementation, you would check against stored tokens
    // This is a simplified version
    if (!token.startsWith('t-')) return false;
    
    const userCredsDir = path.join(__dirname, 'creds', username);
    if (!fs.existsSync(userCredsDir)) return false;
    
    // Check if token matches (simplified)
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Check if number is already paired
 * @param {string} number - WhatsApp number
 * @returns {boolean} Pairing status
 */
function isNumberPaired(number) {
  const credsDir = path.join(__dirname, 'creds');
  if (!fs.existsSync(credsDir)) return false;

  const userDirs = fs.readdirSync(credsDir);
  for (const userDir of userDirs) {
    const credsFile = path.join(credsDir, userDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      const creds = JSON.parse(fs.readFileSync(credsFile));
      if (creds.number === number) return true;
    }
  }
  return false;
}

/**
 * Get all active user sessions
 * @returns {Array} List of active sessions
 */
function getActiveSessions() {
  const sessions = [];
  const credsDir = path.join(__dirname, 'creds');
  
  if (!fs.existsSync(credsDir)) return sessions;

  const userDirs = fs.readdirSync(credsDir);
  userDirs.forEach(userDir => {
    const credsFile = path.join(credsDir, userDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      const creds = JSON.parse(fs.readFileSync(credsFile));
      sessions.push({
        username: userDir,
        number: creds.number,
        deviceId: creds.deviceId,
        pairedAt: creds.pairedAt
      });
    }
  });

  return sessions;
}

/**
 * Clear all user sessions
 * @returns {number} Count of cleared sessions
 */
function clearAllSessions() {
  const credsDir = path.join(__dirname, 'creds');
  if (!fs.existsSync(credsDir)) return 0;

  let count = 0;
  const userDirs = fs.readdirSync(credsDir);
  userDirs.forEach(userDir => {
    const credsFile = path.join(credsDir, userDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      fs.unlinkSync(credsFile);
      count++;
    }
  });

  return count;
}

module.exports = {
  generatePairingCode,
  handlePairing,
  cleanupPairingCodes,
  verifyPairing,
  generateToken,
  validateToken,
  isNumberPaired,
  getActiveSessions,
  clearAllSessions,
  pairingCodes // Export for server-wide access
};