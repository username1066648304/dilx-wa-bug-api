function login() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  const remember = document.getElementById('rememberMe').checked;

  if (user === "admin" && pass === "admin123") {
    if (remember) {
      localStorage.setItem("savedUser", user);
    } else {
      localStorage.removeItem("savedUser");
    }
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    document.getElementById('userLabel').textContent = user;
  } else {
    alert("Wrong credentials!");
  }
}

function logout() {
  localStorage.removeItem("savedUser");
  location.reload();
}

function toggleMenu() {
  const menu = document.getElementById('side-menu');
  menu.classList.toggle('hidden');
}

window.onclick = function (e) {
  const menu = document.getElementById('side-menu');
  if (!e.target.matches('.menu-toggle') && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
};

function showSection(id) {
  document.querySelectorAll('.panel-section').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function startPairing() {
  const number = document.getElementById('targetNumber').value;
  alert(`Pairing started for ${number}`);
}

function createUser() {
  const newUser = document.getElementById('newUsername').value;
  const newPass = document.getElementById('newPassword').value;
  const duration = document.getElementById('duration').value;
  const role = document.getElementById('role').value;

  if (!newUser || !newPass || !duration) {
    return alert("Please fill all fields.");
  }

  alert(`User "${newUser}" with role "${role}" created for ${duration}`);
}

window.onload = () => {
  const saved = localStorage.getItem("savedUser");
  if (saved) {
    document.getElementById('username').value = saved;
    document.getElementById('rememberMe').checked = true;
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    document.getElementById('userLabel').textContent = saved;
  }
};
