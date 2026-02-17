"use client";

import { useState } from "react";

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
}

export default function CommentForm({ onSubmit }: CommentFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await onSubmit(text.trim());
    setText("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="text-xs text-accent hover:text-accent-hover font-medium disabled:opacity-50 transition-colors"
      >
        Post
      </button>
    </form>
  );
}
