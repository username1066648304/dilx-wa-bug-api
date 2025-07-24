// script.js
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  try {
    const res = await fetch("https://dilx-wa-bug-api.vercel.app/api/users");
    const users = await res.json();
    
    const user = users.find(u => u.username === username);

    if (!user) return errorEl.textContent = "❌ Username tidak wujud.";
    if (user.password !== password) return errorEl.textContent = "❌ Kata laluan salah.";

    const now = new Date();
    const expiredAt = new Date(user.expiredAt);
    if (now > expiredAt) return errorEl.textContent = "❌ Akaun telah tamat tempoh.";

    // Simpan session sementara
    sessionStorage.setItem("role", user.role);

    if (user.role === "admin") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "user.html";
    }

  } catch (err) {
    console.error(err);
    errorEl.textContent = "❌ Gagal sambung ke server.";
  }
}// Future login functionality
