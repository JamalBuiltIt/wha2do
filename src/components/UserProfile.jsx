import { useEffect, useState } from "react";
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ bio: "", avatar: "", theme_color: "#ffffff" });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${id}`, {
          headers: authHeaders,
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
        setError(err.message);
      }
    }

    fetchProfile();
  }, [id, token]);

  const toggleFollow = async () => {
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`http://localhost:4000/api/users/${id}/follow`, {
        method,
        headers: authHeaders,
      });

      setIsFollowing(!isFollowing);
      setToast(isFollowing ? "Unfollowed user" : "Now following user");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError("Follow failed");
    }
  };

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

  if (!profile) return <p>Loading...</p>;
  const isOwnProfile = currentUser.id === profile.id;

  return (
    <div className="profile-page">
      {toast && <Toast message={toast} />}
      {error && <div className="error-banner">{error}</div>}

      {/* HEADER */}
      <div
        className="profile-header"
        style={{ background: form.theme_color }}
      >
        <img
          src={form.avatar || "/default-avatar.png"}
          alt="avatar"
          className="profile-avatar"
        />

        {!editMode ? (
          <>
            <h2>{profile.username}</h2>
            <p className="profile-bio">{profile.bio || "No bio yet."}</p>

            <div className="profile-actions">
              {isOwnProfile && (
                <button
                  className="edit-btn"
                  onClick={() => setEditMode(true)}
                  title="Edit profile"
                >
                  ✏️
                </button>
              )}

              {!isOwnProfile && (
                <button onClick={toggleFollow} className="follow-btn">
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
              <button onClick={() => setEditMode(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POSTS */}
      <section className="profile-posts">
        <h3>Posts</h3>
        <PostsFeed posts={posts} />
      </section>
    </div>
  );
}
