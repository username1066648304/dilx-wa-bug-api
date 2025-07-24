
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("error-msg");

  if (username === "dilx" && password === "1") {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "Username atau password salah!";
    errorMsg.style.color = "red";
  }
});

window.onload = () => {
  if (window.location.pathname.includes("dashboard.html") && localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }
};
