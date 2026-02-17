import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-accent">Void</span>space
        </h1>
        <p className="text-xl text-text-muted mb-8 max-w-md mx-auto">
          A social platform for close connections
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="border border-border hover:border-accent text-text font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 flex gap-6 text-sm text-text-muted">
        <Link href="/about" className="hover:text-accent transition-colors">About</Link>
        <Link href="/faq" className="hover:text-accent transition-colors">FAQ</Link>
        <Link href="/tos" className="hover:text-accent transition-colors">Terms</Link>
      </footer>
    </div>
  );
}
