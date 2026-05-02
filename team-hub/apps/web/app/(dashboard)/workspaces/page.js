"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function WorkspacesListPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await api.get("/workspaces");
        setWorkspaces(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  if (loading) return <div className="p-8">Loading workspaces...</div>;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-outfit">Your Workspaces</h2>
          <p className="text-muted-foreground">Select a workspace to start collaborating.</p>
        </div>
        <Link 
          href="/workspaces/new"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          + New Workspace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspace/${ws.id}`}
            className="group block p-6 bg-card rounded-2xl border hover:border-primary hover:shadow-xl transition-all"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-inner"
                style={{ backgroundColor: ws.color || "#6366f1" }}
              >
                {ws.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold font-outfit group-hover:text-primary transition-colors">
                  {ws.name}
                </h3>
                <p className="text-xs text-muted-foreground">{ws._count?.members} members</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {ws.description || "No description provided."}
            </p>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="px-2 py-1 bg-secondary rounded-md">View Workspace →</span>
              <span className="text-muted-foreground">
                Updated {new Date(ws.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-full py-20 text-center bg-secondary/30 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground mb-4">You haven't joined any workspaces yet.</p>
            <Link href="/workspaces/new" className="text-primary font-bold hover:underline">
              Create your first workspace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
