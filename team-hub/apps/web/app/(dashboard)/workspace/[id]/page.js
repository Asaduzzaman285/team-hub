"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import GoalsTab from "@/components/workspace/GoalsTab";
import KanbanTab from "@/components/workspace/KanbanTab";
import AnnouncementsTab from "@/components/workspace/AnnouncementsTab";
import ActivityTab from "@/components/workspace/ActivityTab";
import { useSocket } from "@/hooks/useSocket";

export default function WorkspacePage() {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState("goals");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { on, off } = useSocket(id);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const { data } = await api.get(`/workspaces/${id}`);
        setWorkspace(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspace();

    on("presence-update", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      off("presence-update");
    };
  }, [id, on, off]);

  if (loading) return <div>Loading workspace...</div>;
  if (!workspace) return <div>Workspace not found</div>;

  const tabs = [
    { id: "goals", label: "Strategic Goals", icon: "🎯" },
    { id: "kanban", label: "Kanban Board", icon: "📋" },
    { id: "announcements", label: "Announcements", icon: "📢" },
    { id: "activity", label: "Activity Log", icon: "📜" },
  ];

  return (
    <div className="space-y-8">
      {/* ... (Header) ... */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* ... existing header code ... */}
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ backgroundColor: workspace.color || "#6366f1" }}
          >
            {workspace.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-4xl font-bold font-outfit tracking-tight">{workspace.name}</h2>
            <p className="text-muted-foreground">{workspace.description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex -space-x-2">
            {workspace.members?.map((m) => {
              const isOnline = onlineUsers.some(u => u.id === m.userId);
              return (
                <div 
                  key={m.id}
                  className={`relative w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold transition-all ${isOnline ? "z-10 scale-110 shadow-lg shadow-green-500/20" : ""}`}
                  title={`${m.user?.name || m.user?.email} ${isOnline ? "(Online)" : "(Offline)"}`}
                >
                  {m.user?.name?.[0] || m.user?.email?.[0]?.toUpperCase()}
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
            <button 
              onClick={async () => {
                const email = prompt("Enter the email of the person you want to invite:");
                if (email) {
                  try {
                    await api.post(`/workspaces/${id}/members`, { email, role: "MEMBER" });
                    alert(`Invited ${email} successfully!`);
                    window.location.reload();
                  } catch (err) {
                    alert(err.response?.data?.message || "User not found or already a member.");
                  }
                }
              }}
              className="w-10 h-10 rounded-full border-2 border-background bg-primary text-white flex items-center justify-center text-lg shadow-md hover:scale-110 transition-all z-20"
            >
              +
            </button>
          </div>
          {onlineUsers.length > 0 && (
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest animate-pulse">
              ● {onlineUsers.length} Online Now
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap space-x-1 bg-secondary/50 p-1 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "goals" && <GoalsTab workspaceId={id} />}
        {activeTab === "kanban" && <KanbanTab workspaceId={id} />}
        {activeTab === "announcements" && <AnnouncementsTab workspaceId={id} />}
        {activeTab === "activity" && <ActivityTab workspaceId={id} />}
      </div>
    </div>
  );
}
