import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-xl text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">
          About <span className="text-accent">Void</span>space
        </h1>
        <p className="text-text-muted leading-relaxed mb-6">
          Voidspace is a social platform designed for meaningful connections. Share posts with
          different privacy levels — public, friends, or close friends — and communicate through
          direct messages. Built for people who value genuine relationships over vanity metrics.
        </p>
        <Link href="/" className="text-accent hover:underline text-sm">← Back to home</Link>
      </div>
    </div>
  );
}
