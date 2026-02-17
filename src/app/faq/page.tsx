import Link from "next/link";

const faqs = [
  { q: "What is Voidspace?", a: "Voidspace is a social platform for close connections. Share posts, add friends, and message directly." },
  { q: "What are privacy levels?", a: "Posts can be Public (visible to all), Friends (visible to your friends), or Close Friends (visible only to close friends)." },
  { q: "How do I add friends?", a: "Go to the Friends page and search for a username. You can send a regular friend request or a close friend request." },
  { q: "Is my data private?", a: "Your posts are only visible to the audience you select. We do not sell or share your data with third parties." },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="max-w-xl w-full animate-fade-in">
        <h1 className="text-4xl font-bold mb-8 text-center">FAQ</h1>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-[var(--radius-card)] p-5">
              <h3 className="font-medium text-accent mb-2">{faq.q}</h3>
              <p className="text-sm text-text-muted">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-accent hover:underline text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
