
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username && password) {
    localStorage.setItem('user', username);
    window.location.href = 'index.html';
  } else {
    alert('Please enter username and password');
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function closeSidebarOnTap(event) {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('active')) {
    if (!sidebar.contains(event.target) && event.target.id !== 'menu-btn') {
      sidebar.classList.remove('active');
    }
  }
}

function navigate(page) {
  alert('Navigating to: ' + page);
}

window.onload = () => {
  const user = localStorage.getItem('user');
  if (document.getElementById('showUsername') && user) {
    document.getElementById('showUsername').innerText = user;
  } else if (!user && location.pathname.includes('index.html')) {
    window.location.href = 'login.html';
  }
};
