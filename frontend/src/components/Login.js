import React, { useState } from "react";
import { API_URL } from "../config";
export default function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login`.replace(/\/\/+/g, '/').replace('https:/', 'https://'), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Login failed");
        return;
      }

      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError("Login failed, try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        Don't have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={onShowRegister}
        >
          Register
        </span>
      </p>
    </div>
  );
}
