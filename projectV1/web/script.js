document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      window.location.href = "/web/dashboard.html";
    } else {
      // ❗️Jika login gagal
      errorMsg.style.display = "block";
      errorMsg.textContent = "Username atau Password salah!";
      setTimeout(() => {
        errorMsg.style.display = "none";
      }, 5000);
    }
  } catch (err) {
    console.error("Login error:", err);
    errorMsg.style.display = "block";
    errorMsg.textContent = "Ralat sambungan ke server.";
    setTimeout(() => {
      errorMsg.style.display = "none";
    }, 5000);
  }
});
