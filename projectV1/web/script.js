console.log("ULTRA Login Panel Loaded");

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Sila isi semua ruangan.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("[LOGIN RESPONSE]", data);

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        window.location.href = "/dashboard.html";
      } else {
        alert(data.message || "Login gagal. Sila semak semula.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Ralat sambungan ke server.");
    }
  });
});
