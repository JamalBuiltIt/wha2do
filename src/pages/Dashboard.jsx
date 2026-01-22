import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import Header from "../components/Header.jsx";
import PostsFeed from "../components/PostFeed.jsx";
import Toast from "../components/Toast.jsx";

import "./Dashboard.css";

export default function Dashboard() {
  const { user, token } = useAuth();

  /** -------------------------
   * STATE
   * ------------------------ */
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState(new Set());

  const [newTask, setNewTask] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  /** -------------------------
   * HELPERS
   * ------------------------ */
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  /** -------------------------
   * FETCH TASKS (PRIVATE)
   * ------------------------ */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4000/api/tasks", {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  /** -------------------------
   * FETCH USERS + FOLLOWING
   * ------------------------ */
  const fetchSocialData = useCallback(async () => {
    try {
      const [usersRes, followingRes] = await Promise.all([
        fetch("http://localhost:4000/api/users", { headers: authHeaders }),
        fetch("http://localhost:4000/api/users/me/following", {
          headers: authHeaders,
        }),
      ]);

      if (!usersRes.ok || !followingRes.ok)
        throw new Error("Failed to load social data");

      const usersData = await usersRes.json();
      const followingData = await followingRes.json();

      setUsers(usersData.filter((u) => u.id !== user.id));
      setFollowing(new Set(followingData.map((f) => f.following_id)));
    } catch (err) {
      setError(err.message);
    }
  }, [token, user?.id]);

  /** -------------------------
   * FOLLOW / UNFOLLOW
   * ------------------------ */
  const toggleFollow = async (targetId) => {
    const isFollowing = following.has(targetId);

    try {
      const res = await fetch(
        `http://localhost:4000/api/users/${targetId}/follow`,
        {
          method: isFollowing ? "DELETE" : "POST",
          headers: authHeaders,
        }
      );

      if (!res.ok) throw new Error("Follow action failed");

      setFollowing((prev) => {
        const next = new Set(prev);
        isFollowing ? next.delete(targetId) : next.add(targetId);
        return next;
      });

      const targetUser = users.find((u) => u.id === targetId);
      showToast(
        isFollowing
          ? `Unfollowed ${targetUser.username}`
          : `You are now following ${targetUser.username}`
      );
    } catch (err) {
      setError(err.message);
    }
  };

  /** -------------------------
   * EFFECTS
   * ------------------------ */
  useEffect(() => {
    if (!token) return;
    fetchTasks();
    fetchSocialData();
  }, [token, fetchTasks, fetchSocialData]);

  /** -------------------------
   * RENDER
   * ------------------------ */
  return (
    <div className="dashboard-container">
      <Header />

      {toast && <Toast message={toast} />}
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-grid">
        {/* LEFT: SOCIAL */}
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
                className={`follow-btn ${
                  following.has(u.id) ? "following" : ""
                }`}
                onClick={() => toggleFollow(u.id)}
              >
                {following.has(u.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </aside>

        {/* CENTER: FEED */}
        <main className="feed">
          <PostsFeed following={[...following]} />
        </main>

        {/* RIGHT: TASKS (PRIVATE) */}
        <aside className="tasks-panel">
          <h3>Your Tasks</h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTask.trim()) return;

              setTasks((prev) => [
                ...prev,
                { id: Date.now(), title: newTask, completed: false },
              ]);
              setNewTask("");
            }}
          >
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task…"
            />
            <button>Add</button>
          </form>

          <ul>
            {tasks.map((task) => (
              <li key={task.id}>
                <input type="checkbox" checked={task.completed} readOnly />
                <span
                  style={{
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
