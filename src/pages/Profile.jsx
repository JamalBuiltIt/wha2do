import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Toast from "../components/Toast.jsx";

export default function Profile() {
  const { id } = useParams();
  const { token, user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${id}`, {
          headers: authHeaders,
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data);

        // Fetch posts
        const postsRes = await fetch(
          `http://localhost:4000/api/posts/user/${id}`,
          { headers: authHeaders }
        );
        if (!postsRes.ok) throw new Error("Failed to load posts");
        setPosts(await postsRes.json());

        // Check follow status
        if (currentUser.id !== parseInt(id)) {
          const followRes = await fetch(
            `http://localhost:4000/api/users/me/following`,
            { headers: authHeaders }
          );
          const followData = await followRes.json();
          setFollowing(followData.some((f) => f.following_id === parseInt(id)));
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, [id, token]);

  const toggleFollow = async () => {
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(
        `http://localhost:4000/api/users/${id}/follow`,
        { method, headers: authHeaders }
      );
      if (!res.ok) throw new Error("Follow failed");
      setFollowing(!following);
      setToast(following ? "Unfollowed" : "Now following");
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div className="error-banner">{error}</div>;
  if (!profile) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      {toast && <Toast message={toast} />}
      <div className="profile-header">
        <img src={profile.avatar || "/default-avatar.png"} alt="" />
        <h2>{profile.username}</h2>
        <p>{profile.bio}</p>
        {currentUser.id !== profile.id && (
          <button onClick={toggleFollow}>
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div className="profile-posts">
        <h3>Posts</h3>
        {posts.length ? (
          posts.map((p) => (
            <div key={p.id} className="post-card">
              <p>{p.content}</p>
            </div>
          ))
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
    </div>
  );
}
