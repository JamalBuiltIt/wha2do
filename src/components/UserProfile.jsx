import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfile() {
  const { id } = useParams(); // get user id from URL
  const { user: currentUser, token } = useAuth(); // logged-in user info

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:4000/api/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data.user);
        setPosts(data.posts);
        setTasks(data.tasks);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchProfile();
  }, [id, token]);


  if (error) return <p style={{color:'red'}}>{error}</p>;
  if (!user) return <p>Loading...</p>;

    if (!profile) return <p>Loading profile...</p>;

  const isOwner = currentUser?.id === profile.id;

  return (
    <div style={{ border: `3px solid ${profile.theme_color}`, padding: "1rem" }}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <img
        src={profile.avatar} // later we can allow custom uploaded images
        alt={`${profile.username}'s avatar`}
        style={{ width: 100, height: 100, borderRadius: "50%" }}
      />
      <h2>{profile.username}</h2>
      <p>{profile.bio}</p>

      {isOwner && <button>Edit Profile</button>}

      <h3>Posts</h3>
      <ul>
        {posts.map(p => (
          <li key={p.id}>{p.content}</li>
        ))}
      </ul>

      <h3>Tasks</h3>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title} {t.completed ? "(Done)" : ""}</li>
        ))}
      </ul>
    </div>
  );
}

