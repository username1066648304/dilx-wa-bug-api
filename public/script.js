document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const remember = document.getElementById('remember').checked;

  if (!username || !password) {
    alert('Please fill in all fields!');
    return;
  }

  // Simpan dalam localStorage jika remember me ditanda
  if (remember) {
    localStorage.setItem('savedUsername', username);
    localStorage.setItem('savedPassword', password);
  } else {
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
  }

  // Redirect ke halaman index
  window.location.href = 'index.html';
});

// Auto-fill jika ada simpan
window.addEventListener('DOMContentLoaded', () => {
  const savedUsername = localStorage.getItem('savedUsername');
  const savedPassword = localStorage.getItem('savedPassword');
  if (savedUsername) document.getElementById('username').value = savedUsername;
  if (savedPassword) document.getElementById('password').value = savedPassword;
});
