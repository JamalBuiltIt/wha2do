export default function PostsFeed({ posts = [] }) {
  if (posts.length === 0) {
    return <p>No posts yet</p>;
  }

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {post.content}
        </li>
      ))}
    </ul>
  );
}
