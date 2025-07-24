// ULTRA Panel - Developed by dilxVXII

// Fungsi Login
async function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "/web/dashboard.html";
  } else {
    alert(data.message || "Login failed.");
  }
}

// Fungsi Create User
async function createUser(event) {
  event.preventDefault();
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  const role = document.getElementById("role").value;
  const duration = parseInt(document.getElementById("duration").value);

  const token = localStorage.getItem("token");
  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ username, password, role, duration })
  });

  const data = await response.json();
  if (response.ok) {
    alert("User created successfully.");
  } else {
    alert(data.message || "Failed to create user.");
  }
}

// Fungsi Delete User
async function deleteUser(username) {
  const token = localStorage.getItem("token");
  const response = await fetch(`/api/delete-user?username=${username}`, {
    method: "DELETE",
    headers: {
      "Authorization": token
    }
  });

  const data = await response.json();
  if (response.ok) {
    alert("User deleted.");
    location.reload();
  } else {
    alert(data.message || "Failed to delete user.");
  }
}

// Fungsi List User
async function loadUsers() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/list-user", {
    headers: {
      "Authorization": token
    }
  });

  const data = await response.json();
  if (response.ok) {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    data.users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${new Date(user.expired).toLocaleString()}</td>
        <td><button onclick="deleteUser('${user.username}')">Delete</button></td>
      `;
      userList.appendChild(row);
    });
  } else {
    alert(data.message || "Failed to fetch user list.");
  }
}

// Fungsi Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/web/login.html";
} 
