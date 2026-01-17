import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('http://localhost:4000/api/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Unauthorized');

        const data = await res.json();
        setTasks(data);
      } catch (err) {
        setError('Failed to load tasks');
      }
    }

    if (token) fetchTasks();
  }, [token]);

  console.log("Active User:", user)
  console.log("User Info:", token)
  return (
    <div>
      <Header />
      <h2>Welcome, {user?.username}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {tasks.map(task => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}
