"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

export default function NewPostPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [level, setLevel] = useState(10);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setMediaUrl(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, level, media_url: mediaUrl || null }),
      });

      if (res.ok) {
        router.push("/feed");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create post");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">New Post</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-card border border-border rounded-[var(--radius-card)] px-4 py-3 text-text min-h-32 resize-none focus:outline-none focus:border-accent transition-colors"
            required
          />

          {/* Privacy level */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Who can see this?</label>
            <div className="flex gap-2">
              {[
                { value: 10, label: "Public", color: "green" },
                { value: 20, label: "Friends", color: "blue" },
                { value: 30, label: "Close Friends", color: "purple" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    level === opt.value
                      ? `bg-${opt.color}-500/20 text-${opt.color}-400 border border-${opt.color}-500/30`
                      : "bg-bg border border-border text-text-muted hover:text-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Media (optional)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent/10 file:text-accent file:font-medium hover:file:bg-accent/20 file:cursor-pointer"
            />
            {uploading && <p className="text-xs text-text-muted mt-1">Uploading...</p>}
            {mediaUrl && (
              <div className="mt-2 relative">
                <img src={mediaUrl} alt="Preview" className="max-h-48 rounded-lg" />
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
      </main>
    </>
  );
}
