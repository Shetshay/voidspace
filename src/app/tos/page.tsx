import Link from "next/link";

export default function TOSPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="max-w-xl w-full animate-fade-in">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        <div className="bg-card rounded-[var(--radius-card)] p-6 space-y-4 text-sm text-text-muted leading-relaxed">
          <p>By using Voidspace, you agree to the following terms:</p>
          <p><strong className="text-text">1. Account Responsibility:</strong> You are responsible for maintaining the security of your account and all activity under it.</p>
          <p><strong className="text-text">2. Content:</strong> You retain ownership of content you post. Do not post illegal, harmful, or abusive content.</p>
          <p><strong className="text-text">3. Privacy:</strong> We respect your privacy. Posts are only shown to the audience level you select.</p>
          <p><strong className="text-text">4. Termination:</strong> We may suspend or terminate accounts that violate these terms.</p>
          <p><strong className="text-text">5. Changes:</strong> We may update these terms. Continued use constitutes acceptance.</p>
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-accent hover:underline text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
