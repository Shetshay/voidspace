"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  text: string;
  created_at: string;
  sender_username: string;
}

interface Friend {
  id: number;
  username: string;
  profile_pic: string;
}

export default function ChatPage() {
  const params = useParams();
  const friendId = params.friendId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserId(d.user?.id))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function fetchMessages() {
      fetch(`/api/messages/${friendId}`)
        .then((r) => r.json())
        .then((d) => {
          setMessages(d.messages || []);
          setFriend(d.friend);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    fetchMessages();

    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${friendId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setText("");
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Link href="/messages" className="text-text-muted hover:text-text">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l5-5M5 10l5 5" />
            </svg>
          </Link>
          {friend && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-sm">
                {friend.username[0].toUpperCase()}
              </div>
              <span className="font-medium text-sm">{friend.username}</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading ? (
            <div className="text-center text-text-muted py-12">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isMine
                        ? "bg-accent text-white rounded-br-md"
                        : "bg-card text-text rounded-bl-md"
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-text-muted"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-border flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-accent hover:bg-accent-hover text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1.5l13 6.5-13 6.5V9l8-1-8-1V1.5z" />
            </svg>
          </button>
        </form>
      </main>
    </>
  );
}
