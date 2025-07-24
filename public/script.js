document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = e.target[0].value;
  const password = e.target[1].value;
  const remember = document.getElementById('remember').checked;

  console.log("Login attempt:", { username, password, remember });

  // Simpan ke localStorage jika Remember Me
  if (remember) {
    localStorage.setItem('savedUsername', username);
    localStorage.setItem('savedPassword', password);
  } else {
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
  }

  // Redirect ke index.html
  window.location.href = "index.html";
});

// Auto isi jika Remember Me pernah digunakan
window.onload = function () {
  const savedUsername = localStorage.getItem('savedUsername');
  const savedPassword = localStorage.getItem('savedPassword');
  if (savedUsername && savedPassword) {
    document.querySelector('input[type="text"]').value = savedUsername;
    document.querySelector('input[type="password"]').value = savedPassword;
    document.getElementById('remember').checked = true;
  }
};
