"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import type { Post, Comment } from "@/lib/types";

export default function FriendsFeed() {
  const [posts, setPosts] = useState<(Post & { comments: Comment[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});

    fetch("/api/posts?level=20")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Friends Feed</h1>
        {loading ? (
          <div className="text-center text-text-muted py-12">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            No posts from friends yet. Add some friends to see their posts!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
