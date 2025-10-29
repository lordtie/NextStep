import React, { useState } from "react";
import { API_URL } from "../config";
export default function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/register`.replace(/\/\/+/g, '/').replace('https:/', 'https://'), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, email, password }),
});

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Registration failed");
        return;
      }

      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));
      onRegister(user);
    } catch (err) {
      setError("Registration failed, try again.");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
