
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.left = sidebar.style.left === "0px" ? "-220px" : "0px";
}

function closeSidebarIfOpen(e) {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.style.left === "0px" && !e.target.closest('#sidebar')) {
    sidebar.style.left = "-220px";
  }
}

function navigate(section) {
  document.querySelectorAll('.section').forEach(div => div.classList.remove('active'));
  document.getElementById(section).classList.add('active');
  toggleSidebar();
}

function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  if (u && p) {
    if (document.getElementById("remember").checked) {
      localStorage.setItem("rememberUser", u);
    }
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("rememberUser");
  window.location.href = "login.html";
}

window.onload = () => {
  if (location.pathname.includes("index.html") && localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }

  const user = localStorage.getItem("rememberUser");
  if (user) {
    const field = document.getElementById("userDisplay");
    if (field) field.innerText = user;
    const input = document.getElementById("username");
    if (input) input.value = user;
  }
}
