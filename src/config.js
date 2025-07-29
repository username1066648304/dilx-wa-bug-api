// System Configuration
const config = {
  // Application Settings
  APP_NAME: "UltraXweb",
  APP_VERSION: "2.0.0",
  APP_PORT: process.env.PORT || 2001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Security Settings
  MASTER_TOKEN: process.env.MASTER_TOKEN || "default_master_token_please_change",
  SESSION_SECRET: process.env.SESSION_SECRET || "your_session_secret_key",
  API_PUBLIC: process.env.API_PUBLIC === "true" || false,
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === "true" || false,

  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // Max requests per window

  // WhatsApp Configuration
  WHATSAPP_SESSION_FILE: "creds/owner_creds.json",
  WHATSAPP_PAIRING_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  WHATSAPP_RECONNECT_DELAY: 5000, // 5 seconds

  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000",
  API_TIMEOUT: 5000, // 5 seconds
  MAX_REQUESTS_PER_MINUTE: 5,

  // Telegram Integration
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "@dilxVXII",
  TELEGRAM_ALERTS_ENABLED: process.env.TELEGRAM_ALERTS_ENABLED === "true" || true,

  // Attack Configuration
  ATTACK_TYPES: {
    PHONE: ["invisible_crash", "invisible_ios", "delay_msc"],
    GROUP: ["group_crash", "group_spam"]
  },

  // User Roles
  ROLES: {
    OWNER: "owner",
    ADMIN: "admin",
    RESELLER: "reseller",
    USER: "user"
  },

  // Owner Account (Hardcoded)
  OWNER_ACCOUNT: {
    USERNAME: "dilxVXII",
    PASSWORD: "19972",
    ROLE: "owner",
    TELEGRAM_ID: "7339008277"
  },

  // Path Configuration
  PATHS: {
    CREDS_DIR: "creds",
    USER_CREDS_DIR: username => `creds/${username}/creds.json`,
    LOGS_DIR: "logs"
  },

  // Validation Patterns
  VALIDATION: {
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    PASSWORD: /^.{6,}$/,
    PHONE: /^[0-9]{10,15}$/,
    WHATSAPP_GROUP: /^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9_-]+$/,
    TOKEN: /^t-[a-zA-Z0-9]{32}$/
  }
};

// Export configuration
module.exports = config;