import { useState } from "react";

function Login({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setMessage("Login successful!");

      onLogin(data.user);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo / Icon */}
        <div className="login-icon">
          💬
        </div>

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Sign in to continue chatting
        </p>

        <form onSubmit={handleLogin}>

          {/* Email */}
          <div className="login-field">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>

        </form>

        {/* Login Message */}
        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* Signup Link */}
        <div className="login-footer">
          <span>Don't have an account?</span>

          <button
            type="button"
            className="switch-auth-button"
            onClick={onGoToSignup}
          >
            Sign Up
          </button>
        </div>

      </div>

    </div>
  );
}

export default Login;