import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PostsFeed from "../components/PostFeed.jsx";
import Toast from "../components/Toast.jsx";
import "./UserProfile.css";

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ bio: "", avatar: "", theme_color: "#ffffff" });

  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ================= LOAD PROFILE ================= */
  const loadProfile = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/api/users/${id}`, {
        headers: authHeaders,
        signal,
      });

      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();

      setProfile(data.user);
      setPosts(data.posts || []);
      setIsFollowing(data.isFollowing);

      setForm({
        bio: data.user.bio || "",
        avatar: data.user.avatar || "",
        theme_color: data.user.theme_color || "#ffffff",
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  /* ================= LOAD FOLLOW STATS ================= */
  const loadStats = useCallback(async (signal) => {
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
    } catch {}
  }, [id, token]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    loadProfile(controller.signal);
    loadStats(controller.signal);

    return () => controller.abort();
  }, [loadProfile, loadStats]);

  /* ================= FOLLOW / UNFOLLOW ================= */
  const toggleFollow = async () => {
    try {
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch(`http://localhost:4000/api/users/${id}/follow`, {
        method,
        headers: authHeaders,
      });

      if (!res.ok) throw new Error();

      setIsFollowing(!isFollowing);
      setStats((prev) => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
      }));

      setToast(isFollowing ? "Unfollowed user" : "Now following user");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setError("Action failed");
    }
  };

  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/users/me", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Update failed");

      const updated = await res.json();
      setProfile(updated);
      setEditMode(false);
      setToast("Profile updated");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!profile) return <div className="profile-error">Profile not found</div>;

  const isOwnProfile = currentUser.id === profile.id;

  return (
    <div className="profile-page">
      {toast && <Toast message={toast} />}
      {error && <div className="error-banner">{error}</div>}

      <div className="profile-header" style={{ background: profile.theme_color || "#ffffff" }}>
        <img
          src={profile.avatar || "/default-avatar.png"}
          alt="avatar"
          className="profile-avatar"
        />

        {!editMode ? (
          <>
            <h2>{profile.username}</h2>
            <p className="profile-bio">{profile.bio || "No bio yet."}</p>

            <div className="profile-stats">
              <span><strong>{stats.followers}</strong> Followers</span>
              <span><strong>{stats.following}</strong> Following</span>
            </div>

            <div className="profile-actions">
              {isOwnProfile && (
                <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
              )}

              {!isOwnProfile && (
                <button onClick={toggleFollow} className={`follow-btn ${isFollowing ? "following" : ""}`}>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="edit-panel">
            <input
              type="text"
              placeholder="Avatar URL"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            />

            <textarea
              placeholder="Your bio..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />

            <label>Theme Color</label>
            <input
              type="color"
              value={form.theme_color}
              onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
            />

            <div className="edit-actions">
              <button onClick={saveProfile} className="save-btn">Save</button>
              <button onClick={() => setEditMode(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <section className="profile-posts">
        <h3>Posts</h3>
        <PostsFeed posts={posts} />
      </section>
    </div>
  );
}
