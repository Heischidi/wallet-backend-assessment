import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto flex flex-col space-y-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6 mt-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Wallet Microservice</h1>
            <p className="text-neutral-400 mt-2">gRPC Integration Dashboard</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold tracking-wider">NEXT.JS</span>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold tracking-wider">gRPC</span>
          </div>
        </header>

        <Dashboard />
      </div>
    </main>
  );
}
