import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../components/Header.jsx";

export default function Dashboard() {
  const { user, token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [error, setError] = useState("");

  // Fetch tasks on load or when token changes
  useEffect(() => {
    if (!token) return;

    async function fetchTasks() {
      try {
        const res = await fetch("http://localhost:4000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        setTasks(data);
      } catch {
        setError("Failed to load tasks");
      }
    }

    fetchTasks();
  }, [token]);

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTask.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTask }),
      });

      if (!res.ok) throw new Error("Failed to add task");

      const data = await res.json();
      setTasks((prev) => [data, ...prev]);
      setNewTask("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle task completion
  const toggleComplete = async (task) => {
    try {
      const res = await fetch(`http://localhost:4000/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: task.completed ? 0 : 1,
        }),
      });

      if (!res.ok) throw new Error("Failed to update task");

      const updated = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Header />

      <h2>Welcome, {user?.username}</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Add Task */}
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="New task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <input
                type="checkbox"
                checked={!!task.completed}
                onChange={() => toggleComplete(task)}
              />

              <span
                style={{
                  marginLeft: "8px",
                  textDecoration: task.completed
                    ? "line-through"
                    : "none",
                }}
              >
                {task.title}
              </span>

              <button
                style={{ marginLeft: "10px" }}
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
