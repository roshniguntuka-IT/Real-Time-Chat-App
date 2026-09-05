import { useState } from "react";

function Signup({onGoToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
       `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
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

      // Account created successfully
      setMessage(
        "Account created successfully! Please login."
      );

      // Return to Login page after 1 second
      setTimeout(() => {
        onGoToLogin();
      }, 1000);

    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo / Icon */}
        <div className="login-icon">
          💬
        </div>

        <h1>Create Account</h1>

        <p className="login-subtitle">
          Join the real-time chat community
        </p>

        <form onSubmit={handleSignup}>

          {/* Name */}
          <div className="login-field">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />
          </div>

          {/* Email */}
          <div className="login-field">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              minLength={6}
              required
            />
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="login-button"
          >
            Create Account
          </button>

        </form>

        {/* Message */}
        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* Login Link */}
        <div className="login-footer">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            className="switch-auth-button"
            onClick={onGoToLogin}
          >
            Login
          </button>

        </div>

      </div>

    </div>
  );
}

export default Signup;