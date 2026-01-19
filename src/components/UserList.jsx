import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function UserList() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('http://localhost:4000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();

        // Exclude current user from the list
        const otherUsers = data.filter(u => u.id !== user.id);
        setUsers(otherUsers);
      } catch (err) {
        setError(err.message);
      }
    }

    if (token) fetchUsers();
  }, [token, user]);

  return (
    <div>
      <Header />
      <h2>Users</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {users.map(u => (
          <li key={u.id}>
            {/* Link to profile page for each user */}
            <Link to={`/users/${u.id}`}>{u.username}</Link>
          </li>
        ))}
      </ul>

      <p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </p>
    </div>
  );
}
