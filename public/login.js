
async function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("users.json");
  const users = await response.json();

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.role === "admin") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "apk-access.html";
    }
  } else {
    alert("Login gagal!");
  }
}
