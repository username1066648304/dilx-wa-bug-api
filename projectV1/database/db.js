const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String, // user | reseller | admin
  expiresAt: Date,
  pairedNumber: String
});

const User = mongoose.model("User", userSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(require("../config").MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  User,
  connectDB
};
