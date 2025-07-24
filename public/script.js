function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  menu.style.left = menu.style.left === "0px" ? "-200px" : "0px";
}

function closeMenu() {
  const menu = document.getElementById("sideMenu");
  menu.style.left = "-200px";
}

function logout() {
  localStorage.removeItem("auth");
  window.location.href = "login.html";
}

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const remember = document.getElementById("rememberMe").checked;

  if (user === "admin" && pass === "dilx123") {
    if (remember) localStorage.setItem("auth", user);
    else sessionStorage.setItem("auth", user);
    window.location.href = "index.html";
  } else {
    alert("Invalid credentials");
  }
}

window.onload = () => {
  const path = window.location.pathname;
  if (path.includes("index") || path.includes("pairing") || path.includes("create")) {
    const auth = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    if (!auth) window.location.href = "login.html";
    else document.getElementById("welcomeText").textContent = `Welcome, ${auth}`;
  }
};
