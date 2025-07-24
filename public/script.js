
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (username === "dilx" && password === "1") {
    window.location.href = "/dashboard"; // Ganti jika ada halaman dashboard
  } else {
    errorMsg.textContent = "Username atau password salah.";
  }
}
