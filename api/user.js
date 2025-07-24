// api/users.js
export default function handler(req, res) {
  res.status(200).json([
    {
      username: "admin",
      password: "admin123",
      role: "admin",
      expiredAt: "2099-12-31T23:59:59Z"
    },
    {
      username: "user",
      password: "user123",
      role: "user",
      expiredAt: "2025-07-30T00:00:00Z"
    }
  ]);
}
