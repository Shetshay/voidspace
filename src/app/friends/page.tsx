"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";

interface Friend {
  id: number;
  username: string;
  profile_pic: string;
  bio: string;
  is_close: number;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [requestType, setRequestType] = useState<"friend" | "close">("friend");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function sendRequest() {
    if (!sendTo.trim()) return;
    setMessage("");

    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: sendTo.trim(), type: requestType }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Request sent!");
      setSendTo("");
    } else {
      setMessage(data.error || "Failed to send request");
    }
  }

  const filtered = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        {/* Send request */}
        <div className="bg-card rounded-[var(--radius-card)] p-5 mb-6">
          <h2 className="font-medium mb-3">Add a Friend</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder="Enter username"
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
            />
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as "friend" | "close")}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="friend">Friend</option>
              <option value="close">Close Friend</option>
            </select>
            <button
              onClick={sendRequest}
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          {message && (
            <p className={`text-sm mt-2 ${message.includes("sent") ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search friends..."
          className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text mb-4 focus:outline-none focus:border-accent transition-colors"
        />

        {/* Pending requests link */}
        <a
          href="/friends/requests"
          className="block text-sm text-accent hover:underline mb-4"
        >
          View pending requests →
        </a>

        {/* Friend list */}
        {loading ? (
          <div className="text-center text-text-muted py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            {friends.length === 0 ? "No friends yet. Send a request!" : "No matches."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="bg-card rounded-[var(--radius-card)] p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-sm shrink-0">
                  {f.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.username}</p>
                  {f.bio && <p className="text-xs text-text-muted truncate">{f.bio}</p>}
                </div>
                {f.is_close ? (
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">Close</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
