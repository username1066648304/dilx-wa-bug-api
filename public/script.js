document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const remember = document.getElementById("remember").checked;

  if (username === "admin" && password === "admin123") {
    if (remember) localStorage.setItem("remember", "yes");
    window.location.href = "index.html";
  } else {
    alert("Login gagal! Username atau password salah.");
  }
});
