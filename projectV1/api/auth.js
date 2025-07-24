const express = require("express");
const router = express.Router();
const { User } = require("../database/db");

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const now = new Date();
  if (user.expiresAt && now > user.expiresAt) {
    return res.status(403).json({ message: "Akaun anda telah tamat tempoh." });
  }

  return res.status(200).json({
    username: user.username,
    role: user.role,
    expiresAt: user.expiresAt,
    pairedNumber: user.pairedNumber
  });
});

// Create user (admin/reseller only)
router.post("/create-user", async (req, res) => {
  const { username, password, role, duration } = req.body;

  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
  const newUser = new User({ username, password, role, expiresAt });

  try {
    await newUser.save();
    res.status(201).json({ message: "User created." });
  } catch (err) {
    res.status(500).json({ message: "User creation failed." });
  }
});

// Delete user (admin only)
router.post("/delete-user", async (req, res) => {
  const { username } = req.body;
  try {
    await User.deleteOne({ username });
    res.status(200).json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user." });
  }
});

// Pairing bot
router.post("/pair", async (req, res) => {
  const { username, phone } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.pairedNumber = phone;
  await user.save();

  res.status(200).json({ message: `Paired with ${phone}` });
});

module.exports = router;
