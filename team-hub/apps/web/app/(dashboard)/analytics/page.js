"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data } = await api.get("/workspaces");
      setWorkspaces(data);
      if (data.length > 0) setSelectedId(data[0].id);
    };
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/workspaces/${selectedId}/analytics`);
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedId]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/workspaces/${selectedId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workspace-export-${selectedId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  if (loading && !data) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track progress across your workspaces.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-card border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary font-semibold"
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button 
            onClick={handleExport}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Goals</p>
              <h3 className="text-4xl font-black mt-2 text-primary">{data.stats.totalGoals}</h3>
            </div>
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed (This Week)</p>
              <h3 className="text-4xl font-black mt-2 text-green-500">{data.stats.completedThisWeek}</h3>
            </div>
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overdue Items</p>
              <h3 className="text-4xl font-black mt-2 text-red-500">{data.stats.overdueCount}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h4 className="text-lg font-bold font-outfit mb-6">Velocity (Last 7 Days)</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h4 className="text-lg font-bold font-outfit mb-6">Action Item Distribution</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(data.distribution.actions).map(([key, value]) => ({ name: key, value }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
