import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Register
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });


      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Login immediately after
      const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('HTTP status:', res.status);
      console.log('Raw response object:', res);
      console.log('Parsed data:', data);
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message);

      // Let AuthContext decode the JWT
      login(loginData.token);

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }

  };

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Display Name"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <button type="submit">Register</button>

        <p>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
