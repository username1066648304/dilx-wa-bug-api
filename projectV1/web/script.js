document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorMsg = document.getElementById("error-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Login gagal");
        }

        // Simpan ke localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);
        localStorage.setItem("expiredAt", data.expiredAt);

        // Check expired
        const now = Date.now();
        const expiredAt = new Date(data.expiredAt).getTime();

        if (now > expiredAt) {
          localStorage.clear();
          alert("Akaun telah tamat tempoh");
          return;
        }

        // Redirect ikut role
        if (data.role === "admin" || data.role === "owner") {
          window.location.href = "/web/dashboard.html";
        } else {
          alert("Akses hanya dibenarkan melalui APK");
        }
      } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = "block";
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/web/login.html";
    });
  }

  // Auth guard untuk semua page selain login
  const token = localStorage.getItem("token");
  const expiredAt = localStorage.getItem("expiredAt");
  const currentPath = window.location.pathname;

  if (
    currentPath !== "/web/login.html" &&
    (!token || Date.now() > new Date(expiredAt).getTime())
  ) {
    localStorage.clear();
    window.location.href = "/web/login.html";
  }
});
