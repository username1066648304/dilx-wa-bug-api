const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./api/auth");
const { connectDB } = require("./database/db");
const config = require("./config");
const startBot = require("./telegram/index");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB(); // Sambung MongoDB

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "web")));

app.use("/api", authRoutes);

// Arahkan root ke login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "web", "login.html"));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  startBot(); // Jalankan Telegram Bot
}); 
