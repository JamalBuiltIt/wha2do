import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../components/Header.jsx";
import PostsFeed from "../components/PostFeed.jsx";
import Toast from "../components/Toast.jsx";
import "./Dashboard.css";

/* ---------------- USER SEARCH ---------------- */
function UserSearch({ token }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!query.trim()) return setResults([]);

    const delay = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/users/search?q=${encodeURIComponent(query)}`,
          { headers: authHeaders }
        );
        if (!res.ok) throw new Error();
        setResults(await res.json());
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query, token]);

  return (
    <div className="user-search">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((u) => (
            <li key={u.id}>
              <Link to={`/profile/${u.id}`}>
                <img src={u.avatar || "/default-avatar.png"} alt={u.username} />
                <span>{u.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
export default function Dashboard() {
  const { user, token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ---------------- FETCH TASKS ---------------- */
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:4000/api/tasks", { headers: authHeaders })
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => setError("Failed to load tasks"));
  }, [token]);

  /* ---------------- FETCH USERS + FOLLOWING ---------------- */
  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("http://localhost:4000/api/users", { headers: authHeaders }),
      fetch("http://localhost:4000/api/users/me/following", {
        headers: authHeaders,
      }),
    ])
      .then(async ([uRes, fRes]) => {
        setUsers(await uRes.json());
        const followingData = await fRes.json();
        setFollowing(followingData.map((f) => f.id));
      })
      .catch(() => setError("Failed to load social data"));
  }, [token]);

  /* ---------------- FETCH POSTS ---------------- */
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:4000/api/posts", { headers: authHeaders })
      .then((res) => res.json())
      .then(setPosts)
      .catch(() => setError("Failed to load posts"));
  }, [token]);

  /* ---------------- TASK ACTIONS ---------------- */
  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/api/tasks", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title: newTask }),
      });
      const savedTask = await res.json();
      setTasks((prev) => [savedTask, ...prev]);
      setNewTask("");
    } catch {
      setError("Failed to create task");
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      await fetch(`http://localhost:4000/api/tasks/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ completed: !completed }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
    } catch {
      setError("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:4000/api/tasks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete task");
    }
  };

  /* ---------------- FOLLOW TOGGLE ---------------- */
  const toggleFollow = async (targetId) => {
    const isFollowing = following.includes(targetId);
    const method = isFollowing ? "DELETE" : "POST";

    try {
      await fetch(`http://localhost:4000/api/users/${targetId}/follow`, {
        method,
        headers: authHeaders,
      });

      setFollowing((prev) =>
        isFollowing ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );

      const targetUser = users.find((u) => u.id === targetId);
      setToast(
        isFollowing
          ? `Unfollowed ${targetUser.username}`
          : `Now following ${targetUser.username}`
      );
      setTimeout(() => setToast(null), 2000);
    } catch {
      setError("Follow update failed");
    }
  };

  /* ---------------- CREATE POST ---------------- */
  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/api/posts", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ content: newPost }),
      });
      const postData = await res.json();
      setPosts((prev) => [postData, ...prev]);
      setNewPost("");
      setToast("Post published");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setError("Failed to create post");
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      {toast && <Toast message={toast} />}
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-main">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <h3>People</h3>
          <UserSearch token={token} />
          {users.map((u) => (
            <div key={u.id} className="user-card">
              <Link to={`/profile/${u.id}`} className="user-link">
                <img src={u.avatar || "/default-avatar.png"} alt={u.username} />
                <span>{u.username}</span>
              </Link>
              <button
                className={following.includes(u.id) ? "following-btn" : "follow-btn"}
                onClick={() => toggleFollow(u.id)}
              >
                {following.includes(u.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </aside>

        {/* FEED */}
        <main className="feed">
          <form className="post-form" onSubmit={createPost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something..."
            />
            <button type="submit">Post</button>
          </form>

          <PostsFeed
            posts={posts.filter(
              (p) => following.includes(p.user_id) || p.user_id === user.id
            )}
          />
        </main>

        {/* TASKS PANEL */}
        <aside className="tasks-panel">
          <h3>Your Tasks</h3>

          <form onSubmit={createTask}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
            />
            <button type="submit">Add</button>
          </form>

          <ul className="tasks-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <input
                  type="checkbox"
                  checked={!!task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                />
                <span
                  style={{
                    marginLeft: "8px",
                    textDecoration: task.completed ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </span>
                <button
                  className="delete-task-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
