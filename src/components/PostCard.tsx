"use client";

import { useState } from "react";
import type { Post, Comment } from "@/lib/types";
import CommentForm from "./CommentForm";

interface PostCardProps {
  post: Post & { comments?: Comment[] };
  currentUserId?: number;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);

  const levelLabel = post.level === 30 ? "Close Friends" : post.level === 20 ? "Friends" : "Public";
  const levelColor = post.level === 30 ? "text-purple-400" : post.level === 20 ? "text-blue-400" : "text-green-400";

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  async function handleNewComment(text: string) {
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments([...comments, data.comment]);
    }
  }

  return (
    <div className="bg-card rounded-[var(--radius-card)] p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-sm shrink-0">
          {post.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{post.username}</p>
          <p className="text-xs text-text-muted">
            {timeAgo(post.created_at)} · <span className={levelColor}>{levelLabel}</span>
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.text}</p>

      {/* Media */}
      {post.media_url && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={post.media_url}
            alt="Post media"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-text-muted hover:text-accent transition-colors"
        >
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <span className="font-medium text-accent text-xs">{c.username}</span>
              <span className="text-text-muted text-xs">{c.text}</span>
            </div>
          ))}
          {currentUserId && <CommentForm onSubmit={handleNewComment} />}
        </div>
      )}
    </div>
  );
}
