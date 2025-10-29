const BASE_URL = "http://localhost:5000/api";

export const registerUser = async (user) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  return res.json();
};

export const loginUser = async (user) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  return res.json();
};

export const getTasks = async (userId) => {
  const res = await fetch(`${BASE_URL}/tasks/${userId}`);
  return res.json();
};

export const addTask = async (task) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  return res.json();
};

export const updateTask = async (taskId, updates) => {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  return res.json();
};

export const deleteTask = async (taskId) => {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: "DELETE"
  });
  return res.json();
};
