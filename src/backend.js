const express = require('express');
const fs = require('fs');
const path = require('path');
const { Boom } = require('@hapi/boom');
const { makeWASocket, useSingleFileAuthState, delay } = require('@whiskeysockets/baileys');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load configuration
const config = require('./config');
const { handlePairing, cleanupPairingCodes } = require('./logic');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// Global variables
let sock;
let pairingCodes = {};
let apiStatus = {
  isApiPublic: false,
  isMaintenanceMode: false,
  masterToken: config.MASTER_TOKEN
};

// WhatsApp client initialization
async function initWhatsAppClient() {
  const { state, saveState } = useSingleFileAuthState(path.join(__dirname, 'creds', 'owner_creds.json'));
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: { level: 'silent' }
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveState);

  // Handle connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== 401; // don't reconnect if logged out
      console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        initWhatsAppClient();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened');
    }
  });

  // Clean up expired pairing codes every hour
  setInterval(cleanupPairingCodes, 60 * 60 * 1000, pairingCodes);
}

// Initialize WhatsApp client
initWhatsAppClient().catch(err => console.error('WhatsApp init error:', err));

// API Routes

// System status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    isApiPublic: apiStatus.isApiPublic,
    isMaintenanceMode: apiStatus.isMaintenanceMode,
    whatsappConnected: sock?.user ? true : false
  });
});

// Pairing endpoints
app.post('/api/pair', async (req, res) => {
  try {
    const { number, username, deviceId } = req.body;
    
    if (!number || !/^\d{8,}$/.test(number)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format (must be digits only and at least 8 digits)' });
    }

    const result = await handlePairing(number, username, deviceId, sock, pairingCodes);
    res.json(result);
  } catch (error) {
    console.error('Pairing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during pairing' });
  }
});

app.get('/api/pair', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || !pairingCodes[code]) {
      return res.status(404).json({ success: false, message: 'Invalid pairing code' });
    }

    const pairingData = pairingCodes[code];
    res.json({
      success: true,
      paired: pairingData.paired,
      expiresIn: pairingData.expiresAt - Date.now()
    });
  } catch (error) {
    console.error('Pairing check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// System control endpoints
app.post('/api/toggle-api-mode', (req, res) => {
  if (req.headers.authorization !== `Bearer ${apiStatus.masterToken}`) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { isPublic } = req.body;
  apiStatus.isApiPublic = isPublic;
  
  // Save to config file
  fs.writeFileSync(
    path.join(__dirname, 'config.json'),
    JSON.stringify({ ...config, API_PUBLIC: isPublic }, null, 2)
  );

  res.json({ success: true, isApiPublic: apiStatus.isApiPublic });
});

app.post('/api/toggle-maintenance', (req, res) => {
  if (req.headers.authorization !== `Bearer ${apiStatus.masterToken}`) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { isMaintenance } = req.body;
  apiStatus.isMaintenanceMode = isMaintenance;
  
  // Save to config file
  fs.writeFileSync(
    path.join(__dirname, 'config.json'),
    JSON.stringify({ ...config, MAINTENANCE_MODE: isMaintenance }, null, 2)
  );

  res.json({ success: true, isMaintenanceMode: apiStatus.isMaintenanceMode });
});

app.post('/api/regenerate-token', (req, res) => {
  if (req.headers.authorization !== `Bearer ${apiStatus.masterToken}`) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const newToken = generateToken();
  apiStatus.masterToken = newToken;
  
  // Save to config file
  fs.writeFileSync(
    path.join(__dirname, 'config.json'),
    JSON.stringify({ ...config, MASTER_TOKEN: newToken }, null, 2)
  );

  res.json({ success: true, token: newToken });
});

// Attack API endpoint
app.post('/api/attack', async (req, res) => {
  try {
    // Check maintenance mode
    if (apiStatus.isMaintenanceMode) {
      return res.status(503).json({ success: false, message: 'Service unavailable during maintenance' });
    }

    // Check API mode and token
    if (!apiStatus.isApiPublic) {
      const token = req.query.token || req.headers.authorization?.split(' ')[1];
      if (!token || !validateToken(token)) {
        return res.status(403).json({ success: false, message: 'API is in private mode. Valid token required.' });
      }
    }

    const { target, type } = req.body;
    
    // Validate attack parameters
    if (!target || !type) {
      return res.status(400).json({ success: false, message: 'Missing target or attack type' });
    }

    // Here you would implement the actual attack logic
    // This is just a placeholder implementation
    const attackResult = await simulateAttack(target, type);
    
    res.json({ success: true, result: attackResult });
  } catch (error) {
    console.error('Attack error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Telegram webhook endpoint
app.post('/api/telegram', async (req, res) => {
  try {
    const { chatId, text } = req.body;
    
    if (!chatId || !text) {
      return res.status(400).json({ success: false, message: 'Missing chatId or text' });
    }

    // Send message via WhatsApp
    await sock.sendMessage(`${chatId}@s.whatsapp.net`, { text });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
});

// Helper functions
function generateToken() {
  return 't-' + [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
}

function validateToken(token) {
  // In a real implementation, you would check against stored tokens
  return token.startsWith('t-') && token.length === 34;
}

async function simulateAttack(target, type) {
  // Simulate attack with random success/failure
  await delay(1000 + Math.random() * 2000); // Random delay 1-3 seconds
  
  const success = Math.random() > 0.2; // 80% success rate
  return {
    target,
    type,
    success,
    message: success ? 'Attack completed successfully' : 'Attack failed',
    timestamp: new Date().toISOString()
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UltraXweb API server running on port ${PORT}`);
  console.log(`API Mode: ${apiStatus.isApiPublic ? 'Public' : 'Private'}`);
  console.log(`Maintenance Mode: ${apiStatus.isMaintenanceMode ? 'ON' : 'OFF'}`);
});

module.exports = app;