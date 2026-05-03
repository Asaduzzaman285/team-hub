"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "bg-slate-200 text-slate-700" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-100 text-blue-700" },
  { id: "DONE", title: "Done", color: "bg-green-100 text-green-700" },
];

export default function ActionItemsTab({ workspaceId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban"); // 'kanban' or 'list'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString) => {
    if (!mounted || !dateString) return "No due date";
    return new Date(dateString).toLocaleDateString();
  };
  const { on, off } = useSocket(workspaceId);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await api.get(`/action-items/workspace/${workspaceId}`);
      setItems(data);
      setLoading(false);
    };
    fetchItems();

    on("action-item-updated", (updatedItem) => {
      setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    });

    on("action-item-created", (newItem) => {
      setItems((prev) => {
        if (prev.find((i) => i.id === newItem.id)) return prev;
        return [newItem, ...prev];
      });
    });

    return () => {
      off("action-item-updated");
      off("action-item-created");
    };
  }, [workspaceId, on, off]);

  const handleMove = async (id, newStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    try {
      await api.patch(`/action-items/${id}`, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    const title = prompt("Enter task title:");
    if (title) {
      await api.post("/action-items", { title, workspaceId, status: "TODO" });
    }
  };

  if (loading) return <div>Loading items...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-secondary/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setView("kanban")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'kanban' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            📋 Kanban
          </button>
          <button 
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            📑 List View
          </button>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          + New Action Item
        </button>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold font-outfit flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${col.color.split(" ")[0]}`}></span>
                  <span>{col.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {items.filter((i) => i.status === col.id).length}
                  </span>
                </h3>
              </div>

              <div className="bg-secondary/30 p-2 rounded-2xl min-h-[500px] border border-dashed border-border/50">
                {items
                  .filter((item) => item.status === col.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-card p-4 rounded-xl border mb-3 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === "HIGH" ? "bg-red-100 text-red-600" : 
                          item.priority === "MEDIUM" ? "bg-amber-100 text-amber-600" : 
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold mb-3">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-6 rounded-full bg-primary/20 border border-background text-[10px] flex items-center justify-center font-bold">
                          {item.assignee?.name?.[0] || "?"}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {col.id !== "TODO" && (
                            <button 
                              onClick={() => handleMove(item.id, col.id === "DONE" ? "IN_PROGRESS" : "TODO")}
                              className="p-1 hover:bg-secondary rounded text-xs"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== "DONE" && (
                            <button 
                              onClick={() => handleMove(item.id, col.id === "TODO" ? "IN_PROGRESS" : "DONE")}
                              className="p-1 hover:bg-secondary rounded text-xs"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm animate-in">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-6 py-4">
                    <select 
                      value={item.status}
                      onChange={(e) => handleMove(item.id, e.target.value)}
                      className="text-xs font-bold bg-secondary/50 rounded-lg px-2 py-1 outline-none"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 font-medium">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === "HIGH" ? "bg-red-100 text-red-600" : 
                      item.priority === "MEDIUM" ? "bg-amber-100 text-amber-600" : 
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                      {item.assignee?.name?.[0] || "?"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
             <div className="p-12 text-center text-muted-foreground italic">No action items found.</div>
          )}
        </div>
      )}
    </div>
  );
}
