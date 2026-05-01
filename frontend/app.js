let token = localStorage.getItem("token");

function register() {
  fetch("/api/auth/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: document.getElementById("role").value
    })
  })
  .then(res => res.json())
  .then(() => {
    alert("Registered successfully!");
    window.location.href = "login.html";
  });
}

// LOAD PROJECTS
function loadProjects() {
  fetch("/api/projects", {
    headers: { Authorization: token }
  })
  .then(res => res.json())
  .then(data => {
    let list = document.getElementById("projects");
    let select = document.getElementById("projectSelect");

    list.innerHTML = "";
    select.innerHTML = "";

    data.forEach(p => {
      list.innerHTML += `<li onclick="loadTasks(${p.id})">${p.name}</li>`;
      select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
  });
}

// CREATE PROJECT
function createProject() {
  let name = document.getElementById("projectName").value;

  fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ name })
  })
  .then(() => loadProjects());
}

// CREATE TASK
function createTask() {
  let data = {
    title: document.getElementById("title").value,
    description: document.getElementById("desc").value,
    due_date: document.getElementById("due").value,
    priority: document.getElementById("priority").value,
    project_id: document.getElementById("projectSelect").value,
    assigned_to: document.getElementById("assigned").value
  };

  fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify(data)
  })
  .then(() => alert("Task created"));
}

// LOAD TASKS
function loadMyTasks() {
  fetch("/api/tasks/my", {
    headers: { Authorization: token }
  })
  .then(res => res.json())
  .then(data => {
    let container = document.getElementById("tasks");
    container.innerHTML = "";

    data.forEach(t => {
      container.innerHTML += `
        <div>
          <b>${t.title}</b><br/>
          ${t.description}<br/>
          Status: ${t.status}<br/>
          <select onchange="updateTask(${t.id}, this.value)">
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      `;
    });
  });
}

// UPDATE TASK
function updateTask(id, status) {
  fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ status })
  });
}

function getUserRole(projectId) {
  return fetch(`/api/projects/role/${projectId}`, {
    headers: { Authorization: token }
  }).then(res => res.json());
}

function login() {
  fetch("/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.token) {
      alert("Login failed");
      return;
    }

    localStorage.setItem("token", data.token);

    // 🔥 Redirect based on role
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "member.html";
    }
  });
}

function loadDashboard() {
  fetch("/api/tasks/dashboard", {
    headers: { Authorization: token }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("stats").innerText =
      `Total: ${data.total}
Todo: ${data.todo}
In Progress: ${data.inprogress}
Done: ${data.done}
Overdue: ${data.overdue}`;
  });
}

function addMember() {
  const project_id = document.getElementById("projectSelect").value;
  const user_id = document.getElementById("memberUserId").value;

  fetch("/api/projects/add-member", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ project_id, user_id })
  })
  .then(res => res.json())
  .then(data => alert(data));
}
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
// INIT
loadProjects();