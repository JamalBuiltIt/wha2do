import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserProfile() {
  const { id } = useParams();
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:4000/api/posts/user/${id}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        setUser(data.user);
        setPosts(data.posts);
      } catch (err) {
        setError(err.message);
      }
    }

    if (token) fetchProfile();
  }, [id, token]);

  if (error) return <p style={{color:'red'}}>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>{user.username}'s Profile</h2>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            {post.content} ({new Date(post.created_at).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
