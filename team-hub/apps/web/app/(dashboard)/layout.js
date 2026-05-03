"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import api from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

export default function DashboardLayout({ children }) {
  const { user, setUser, logout, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { on, off } = useSocket();

  useEffect(() => {
    // Wait until Zustand has loaded from localStorage before deciding
    if (!hasHydrated) return;

    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        logout();
        router.push("/login");
      }
    };

    if (!user) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [user, setUser, logout, router, hasHydrated]);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const { data } = await api.get("/auth/notifications");
      setNotifications(data);
    };
    fetchNotifications();

    on("notification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    return () => off("notification");
  }, [user, on, off]);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    logout();
    router.push("/login");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const { data } = await api.patch("/auth/profile", { avatar: reader.result });
        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-outfit text-xl">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Workspaces", href: "/workspaces", icon: "🏢" },
    { name: "Analytics", href: "/analytics", icon: "📈" },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold font-outfit tracking-tight text-primary">
            Team Hub
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 p-2">
            <div className="relative group cursor-pointer">
              <input type="file" id="avatar" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              <label htmlFor="avatar" className="cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-transparent group-hover:border-primary transition-all">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0] || user?.email?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  ✎
                </div>
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold font-outfit">
            {navItems.find((i) => i.href === pathname)?.name || "Page"}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-card">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-secondary/20">
                    <h4 className="font-bold text-sm">Notifications</h4>
                    <button 
                      onClick={async () => {
                        await api.post("/auth/notifications/read");
                        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                      }}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 hover:bg-secondary/10 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}>
                        <p className="text-sm">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-muted-foreground italic text-sm">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="md:hidden">
               <button className="p-2 rounded-lg hover:bg-secondary">☰</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto animate-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
