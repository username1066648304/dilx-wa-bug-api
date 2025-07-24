function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.right = sidebar.style.right === "0px" ? "-250px" : "0px";
}

window.onclick = function (event) {
  const sidebar = document.getElementById("sidebar");
  if (!event.target.closest(".sidebar") && !event.target.closest(".menu-toggle")) {
    sidebar.style.right = "-250px";
  }
};

function navigateTo(section) {
  const content = document.getElementById("content-area");
  if (section === "pairing") {
    content.innerHTML = `<h2>Pairing Menu</h2><input type="text" placeholder="Enter Number Target" /><button>Trigger</button>`;
  } else if (section === "create-user") {
    content.innerHTML = `<h2>Create User</h2><input type="text" placeholder="Username" /><input type="password" placeholder="Password" /><button>Create</button>`;
  }
}

function logout() {
  localStorage.removeItem("savedUser");
  document.getElementById("login-container").classList.remove("hidden");
  document.getElementById("main-content").classList.add("hidden");
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const remember = document.getElementById("remember").checked;

  if (remember) {
    localStorage.setItem("savedUser", username);
  }

  document.getElementById("username-display").textContent = username;
  document.getElementById("login-container").classList.add("hidden");
  document.getElementById("main-content").classList.remove("hidden");
});

window.onload = function () {
  const saved = localStorage.getItem("savedUser");
  if (saved) {
    document.getElementById("username-display").textContent = saved;
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
  }
};
