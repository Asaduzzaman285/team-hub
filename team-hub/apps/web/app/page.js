import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl space-y-8 animate-in">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter text-foreground">
              Work <span className="text-primary">Better</span> Together.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The premium hub for teams to track goals, manage tasks, and stay connected with real-time updates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/login"
              className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-105 transition-all w-full sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              href="/register"
              className="px-10 py-4 bg-card text-foreground border rounded-2xl font-bold text-lg hover:bg-secondary transition-all w-full sm:w-auto"
            >
              Join Your Team
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 pt-16 opacity-60">
            {["Real-time Sync", "Goal Tracking", "Kanban Boards", "Audit Logs", "Analytics"].map((f) => (
              <span key={f} className="px-4 py-2 bg-secondary rounded-full text-sm font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 Collaborative Team Hub. Built for peak performance.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
