"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function ActivityTab({ workspaceId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}/audit-logs`);
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [workspaceId]);

  if (loading) return <div>Loading activity...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in">
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-secondary/20">
          <h3 className="text-xl font-bold font-outfit">Workspace Activity</h3>
          <p className="text-sm text-muted-foreground">A complete audit trail of all actions.</p>
        </div>
        <div className="divide-y">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-secondary/10 transition-colors flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {log.action[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm">
                    <span className="font-bold text-foreground">{log.user?.name || "Someone"}</span>
                    {" "}
                    <span className="text-muted-foreground">performed</span>
                    {" "}
                    <span className="font-mono text-xs px-2 py-0.5 bg-secondary rounded text-primary">
                      {log.action}
                    </span>
                    {" on "}
                    <span className="font-medium">{log.entityType}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                {log.details && (
                  <p className="text-xs text-muted-foreground mt-1 bg-secondary/30 p-2 rounded italic">
                    Details: {log.details}
                  </p>
                )}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-20 text-center text-muted-foreground italic">
              No activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
