"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface Profile {
  id: number;
  username: string;
  profile_pic: string;
  bio: string;
  created_at: string;
  postCount: number;
  friendCount: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Nav />
        <div className="text-center text-text-muted py-24">Loading...</div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Nav />
        <div className="text-center text-text-muted py-24">Profile not found</div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card rounded-[var(--radius-card)] p-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-2xl shrink-0">
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-text-muted text-sm">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-text-muted mb-6">{profile.bio}</p>
          )}

          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-2xl font-bold text-accent">{profile.postCount}</p>
              <p className="text-xs text-text-muted">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{profile.friendCount}</p>
              <p className="text-xs text-text-muted">Friends</p>
            </div>
          </div>

          <Link
            href="/profile/edit"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-medium text-sm px-6 py-2 rounded-lg transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </main>
    </>
  );
}
