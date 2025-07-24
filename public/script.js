function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;

  if (user === "admin" && pass === "admin123") {
    if (remember) {
      localStorage.setItem("dilx_user", user);
    }
    window.location.href = "index.html";
  } else {
    alert("Invalid username or password.");
  }
}

// Auto-login jika remembered
window.onload = () => {
  const savedUser = localStorage.getItem("dilx_user");
  if (savedUser) {
    window.location.href = "index.html";
  }
};
