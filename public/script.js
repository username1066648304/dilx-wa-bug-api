document.getElementById("login-form")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const user = this.querySelector("input[type=text]").value.trim();
  const pass = this.querySelector("input[type=password]").value.trim();
  const err = document.getElementById("error-message");

  if (user === "dilx" && pass === "1") {
    err.textContent = "";
    sessionStorage.setItem("dilxUser", user);
    window.location.href = "index.html"; // <-- Redirect ke halaman utama kamu
  } else {
    err.textContent = "Username atau password salah!";
  }
});
