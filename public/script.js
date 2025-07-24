document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-message");

  if (username === "dilx" && password === "1") {
    errorMessage.textContent = "";
    console.log("Login success!");
    // Redirect or trigger system here
    alert("Login Berjaya!");
  } else {
    errorMessage.textContent = "Username atau password salah!";
  }
});
