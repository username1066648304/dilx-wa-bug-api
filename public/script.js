document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = this.querySelector("input[type=text]").value;
  const password = this.querySelector("input[type=password]").value;

  console.log("Login attempt:", username, password);
  // API login boleh sambung di sini
});
