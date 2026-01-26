import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function UserSearch() {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/users/search?q=${encodeURIComponent(query)}`,
          { headers: authHeaders }
        );
        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="user-search">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((u) => (
            <li key={u.id}>
              <Link to={`/profile/${u.id}`}>
                <img src={u.avatar || "/default-avatar.png"} alt={u.username} />
                <span>{u.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
