import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfile() {
  const { id } = useParams(); // target user ID
  const { token } = useAuth();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function fetchUser() {
      try {
        setError("");
        const res = await fetch(`http://localhost:4000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load user profile");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    }

    async function fetchPosts() {
      try {
        const res = await fetch(`http://localhost:4000/api/posts?user_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load posts");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchUser();
    fetchPosts();
  }, [id, token]);

  const followUser = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to follow user");
      alert("Followed successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!user) return <p>Loading user...</p>;

  return (
    <div>
      <h2>{user.username}</h2>
      {user.bio && <p>{user.bio}</p>}
      <img src={user.avatar} alt="avatar" width={100} />
      <button onClick={followUser}>Follow</button>

      <h3>Posts</h3>
      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        <ul style={{ listStyleType: "none" }}>
          {posts.map((p) => (
            <li key={p.id}>
              <strong>{user.username}</strong>: {p.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
