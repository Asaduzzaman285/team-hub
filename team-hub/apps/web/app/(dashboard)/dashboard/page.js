"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/workspaces");
        setWorkspaces(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-primary animate-pulse">Initializing dashboard...</div>;

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="relative p-8 rounded-3xl bg-primary text-primary-foreground overflow-hidden shadow-2xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black font-outfit tracking-tight">
            Welcome back, {user?.name || "Member"}!
          </h2>
          <p className="text-lg opacity-90 max-w-xl">
            You're currently active in {workspaces.length} workspaces. Ready to hit your goals today?
          </p>
          <div className="pt-4 flex gap-4">
             <Link href="/workspaces" className="bg-white text-primary px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all">
               Browse Workspaces
             </Link>
             <Link href="/analytics" className="bg-primary-foreground/20 text-white px-6 py-2 rounded-xl font-bold backdrop-blur-md border border-white/20 hover:bg-primary-foreground/30 transition-all">
               View Analytics
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-3xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-outfit">Quick Access</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">Recent</span>
          </div>
          <div className="space-y-3">
             {workspaces.slice(0, 3).map(ws => (
               <Link 
                key={ws.id} 
                href={`/workspace/${ws.id}`}
                className="flex items-center p-3 hover:bg-secondary rounded-2xl transition-all border border-transparent hover:border-border"
               >
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mr-4">
                    {ws.name[0]}
                 </div>
                 <div className="flex-1">
                    <p className="font-bold text-sm">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">{ws._count?.members} members</p>
                 </div>
                 <span className="text-xl">→</span>
               </Link>
             ))}
          </div>
        </div>

        <div className="bg-card p-8 rounded-3xl border shadow-sm space-y-6 flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-3xl mb-4">🚀</div>
           <h3 className="text-xl font-bold font-outfit">Peak Performance</h3>
           <p className="text-sm text-muted-foreground max-w-xs">
             Teams using Team Hub see a 40% increase in goal completion within the first month.
           </p>
           <Link href="/workspaces/new" className="text-primary font-bold text-sm mt-4 hover:underline">
             + Start a new initiative
           </Link>
        </div>
      </div>
    </div>
  );
}
