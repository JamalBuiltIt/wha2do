import { useState } from "react";

export default function EditProfileForm({ user, token, onSave, onCancel }) {
  const [form, setForm] = useState({
    username: user.username || "",
    bio: user.bio || "",
    theme_color: user.theme_color || "#4f46e5",
    is_private: user.is_private || 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedUser = await res.json();
      onSave(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="edit-profile-form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <input
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="Username"
      />

      <textarea
        name="bio"
        value={form.bio}
        onChange={handleChange}
        placeholder="Bio"
      />

      <label>Theme Color</label>
      <input
        type="color"
        name="theme_color"
        value={form.theme_color}
        onChange={handleChange}
      />

      <label className="privacy-toggle">
        <input
          type="checkbox"
          name="is_private"
          checked={!!form.is_private}
          onChange={handleChange}
        />
        Private Account
      </label>

      <div className="profile-actions">
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
