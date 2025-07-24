
// Proteksi dashboard
const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "admin") {
  window.location.href = "login.html";
}
