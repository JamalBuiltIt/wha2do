import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Header from "../components/Header.jsx";
import PostsFeed from "../components/PostFeed.jsx";
import Toast from "../components/Toast.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, token } = useAuth();

  /* ---------------- STATE ---------------- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [newPost, setNewPost] = useState("");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ---------------- TASKS (PRIVATE) ---------------- */
  useEffect(() => {
    if (!token) return;

    async function fetchTasks() {
      try {
        const res = await fetch("http://localhost:4000/api/tasks", {
          headers: authHeaders,
        });
        if (!res.ok) throw new Error("Failed to load tasks");
        setTasks(await res.json());
      } catch (err) {
        setError(err.message);
      }
    }

    fetchTasks();
  }, [token]);

  /* ---------------- USERS + FOLLOWING ---------------- */
  useEffect(() => {
    if (!token) return;

    async function fetchSocialData() {
      try {
        const [usersRes, followingRes] = await Promise.all([
          fetch("http://localhost:4000/api/users", { headers: authHeaders }),
          fetch("http://localhost:4000/api/users/me/following", {
            headers: authHeaders,
          }),
        ]);

        if (!usersRes.ok || !followingRes.ok)
          throw new Error("Failed to load social data");

        setUsers(await usersRes.json());

        const followingData = await followingRes.json();
        setFollowing(followingData.map((f) => f.following_id));
      } catch (err) {
        setError(err.message);
      }
    }

    fetchSocialData();
  }, [token]);

  /* ---------------- FOLLOW TOGGLE ---------------- */
  const toggleFollow = async (targetId) => {
    try {
      const isFollowing = following.includes(targetId);
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch(
        `http://localhost:4000/api/users/${targetId}/follow`,
        { method, headers: authHeaders }
      );

      if (!res.ok) throw new Error("Follow update failed");

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
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------------- POST CREATION (PUBLIC) ---------------- */
  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/api/posts", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ content: newPost }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      setNewPost("");
      setToast("Post published");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="dashboard-container">
      <Header />

      {toast && <Toast message={toast} />}
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-main">
        {/* ---------- LEFT: USERS ---------- */}
        <aside className="sidebar">
          <h3>People</h3>
          {users.map((u) => (
            <div key={u.id} className="user-card">
              <Link to={`/profile/${u.id}`} className="user-link">
                <img
                  src={u.avatar || "/default-avatar.png"}
                  alt={u.username}
                />
                <span>{u.username}</span>
              </Link>

              <button
                className={
                  following.includes(u.id)
                    ? "following-btn"
                    : "follow-btn"
                }
                onClick={() => toggleFollow(u.id)}
              >
                {following.includes(u.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </aside>

        {/* ---------- CENTER: FEED ---------- */}
        <main className="feed">
          <form className="post-form" onSubmit={createPost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something..."
            />
            <button type="submit">Post</button>
          </form>

          <PostsFeed following={following} />
        </main>

        {/* ---------- RIGHT: TASKS (PRIVATE) ---------- */}
        <aside className="tasks-panel">
          <h3>Your Tasks</h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTask.trim()) return;
              setTasks((prev) => [
                ...prev,
                { id: Date.now(), title: newTask },
              ]);
              setNewTask("");
            }}
          >
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
            />
            <button>Add</button>
          </form>

          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <input type="checkbox" checked={!!task.completed} readOnly />
                <span
                  style={{
                    marginLeft: "8px",
                    textDecoration: task.completed ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
