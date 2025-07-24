const TelegramBot = require("node-telegram-bot-api");
const { User } = require("../database/db");
const { TELEGRAM_TOKEN, TELEGRAM_OWNER_ID } = require("../config");

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (userId.toString() !== TELEGRAM_OWNER_ID) return;

  bot.sendMessage(chatId, `👑 Bot Ultra telah diaktifkan oleh dilxVXII.\nGunakan /users untuk lihat semua user.`);
});

// /users command
bot.onText(/\/users/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (userId.toString() !== TELEGRAM_OWNER_ID) return;

  const users = await User.find();
  if (!users.length) return bot.sendMessage(chatId, "❌ Tiada user ditemukan.");

  const list = users.map((u, i) => {
    const expired = u.expiresAt ? new Date(u.expiresAt).toLocaleString("ms-MY") : "Tiada";
    return `${i + 1}. ${u.username} (${u.role})\n📅 Exp: ${expired}\n🔗 Pair: ${u.pairedNumber || "-"}\n`;
  }).join("\n────────────\n");

  bot.sendMessage(chatId, `📦 Senarai User:\n\n${list}`);
});

// Function: notifyPairing
async function notifyPairing(username, number) {
  await bot.sendMessage(TELEGRAM_OWNER_ID, `🔗 Pairing baru berjaya:\n👤 ${username}\n📱 ${number}`);
}

// Export bot & pairing function
module.exports = {
  bot,
  notifyPairing,
};
