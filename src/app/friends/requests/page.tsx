"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";

interface FriendRequest {
  id: number;
  from_id: number;
  type: string;
  from_username: string;
  from_profile_pic: string;
  created_at: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends/requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(requestId: number, action: "accept" | "decline") {
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (res.ok) {
      setRequests(requests.filter((r) => r.id !== requestId));
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>

        {loading ? (
          <div className="text-center text-text-muted py-12">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-card rounded-[var(--radius-card)] p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-sm shrink-0">
                  {req.from_username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{req.from_username}</p>
                  <p className="text-xs text-text-muted">
                    {req.type === "close" ? "Close friend request" : "Friend request"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.id, "accept")}
                    className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "decline")}
                    className="bg-white/5 hover:bg-white/10 text-text-muted text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
