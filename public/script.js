
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;
      const remember = document.getElementById("rememberMe").checked;
      if (user && pass) {
        if (remember) {
          localStorage.setItem("remember", "true");
          localStorage.setItem("user", user);
        }
        sessionStorage.setItem("user", user);
        window.location.href = "index.html";
      }
    });

    if (localStorage.getItem("remember") === "true") {
      document.getElementById("username").value = localStorage.getItem("user");
      document.getElementById("rememberMe").checked = true;
    }
  }

  if (window.location.pathname.includes("index")) {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!user) window.location.href = "login.html";
    document.getElementById("usernameDisplay").innerText = user;
    document.getElementById("welcomeText").innerText = "Welcome, " + user;
  }
});

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.querySelector(".overlay").classList.toggle("show");
}

function navigate(page) {
  alert("Navigate to: " + page); // Placeholder
  toggleSidebar();
}

function triggerBug() {
  alert("Bug triggered!");
}
