
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (username === "dilx" && password === "1") {
    window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "Username atau Password salah!";
  }
});
