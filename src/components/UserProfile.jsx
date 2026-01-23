import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfile() {
  const { id } = useParams();
  const { token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;

    async function fetchProfile() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("User not found");

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchProfile();
  }, [id, token]);

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <img
        src={profile.avatar || "/default-avatar.png"}
        alt={profile.username}
      />
      <h2>{profile.username}</h2>
      <p>{profile.bio || "This user has no bio yet."}</p>
    </div>
  );
}
