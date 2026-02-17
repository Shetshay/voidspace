"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface Conversation {
  id: number;
  username: string;
  profile_pic: string;
  last_message: string | null;
  last_message_at: string | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {loading ? (
          <div className="text-center text-text-muted py-12">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-text-muted py-12">
            No conversations yet. Add friends to start messaging!
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 bg-card hover:bg-card-hover rounded-[var(--radius-card)] p-4 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center shrink-0">
                  {conv.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{conv.username}</p>
                    {conv.last_message_at && (
                      <span className="text-xs text-text-muted">{timeAgo(conv.last_message_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">
                    {conv.last_message || "No messages yet"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
