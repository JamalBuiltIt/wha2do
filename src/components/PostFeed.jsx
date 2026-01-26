import { Link } from "react-router-dom";
import "./PostFeed.css"; // optional for styling

export default function PostsFeed({ posts }) {
  if (!posts || posts.length === 0) {
    return <p className="no-posts">No posts to display</p>;
  }

  return (
    <div className="posts-feed">
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <Link to={`/profile/${post.user_id}`} className="post-user">
              <img
                src={post.avatar || "/default-avatar.png"}
                alt={post.username}
                className="post-avatar"
              />
              <strong>{post.username}</strong>
            </Link>
            <span className="post-date">
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>
          <p className="post-content">{post.content}</p>
        </div>
      ))}
    </div>
  );
}
