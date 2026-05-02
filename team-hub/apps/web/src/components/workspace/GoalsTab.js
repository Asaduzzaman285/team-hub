"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useOptimisticList } from "@/hooks/useOptimistic";

export default function GoalsTab({ workspaceId }) {
  const [goals, setGoals, setRawGoals] = useOptimisticList([], async (type, payload) => {
    if (type === "CREATE") {
      const { data } = await api.post("/goals", { ...payload, workspaceId });
      return data;
    }
    if (type === "UPDATE") {
      const { data } = await api.patch(`/goals/${payload.id}`, payload);
      return data;
    }
    if (type === "DELETE") {
      await api.delete(`/goals/${payload.id}`);
      return payload;
    }
  });

  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  useEffect(() => {
    const fetchGoals = async () => {
      const { data } = await api.get(`/goals/workspace/${workspaceId}`);
      setRawGoals(data);
      setLoading(false);
    };
    fetchGoals();
  }, [workspaceId]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const payload = { title: newGoalTitle };
    setNewGoalTitle("");
    await setGoals("CREATE", payload);
  };

  const handleToggleGoal = async (goal) => {
    const newStatus = goal.status === "DONE" ? "TODO" : "DONE";
    await setGoals("UPDATE", { id: goal.id, status: newStatus });
  };

  if (loading) return <div>Loading goals...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h3 className="text-xl font-bold font-outfit mb-4">Strategic Goals</h3>
        <form onSubmit={handleAddGoal} className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 rounded-xl border bg-background"
            placeholder="What's the next big goal?"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
          />
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold">
            Add Goal
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`p-4 bg-card border rounded-xl flex items-center justify-between group transition-all ${
              goal.isOptimistic ? "opacity-50" : ""
            } ${goal.status === "DONE" ? "bg-secondary/50" : ""}`}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleToggleGoal(goal)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  goal.status === "DONE" ? "bg-primary border-primary" : "border-muted-foreground"
                }`}
              >
                {goal.status === "DONE" && <span className="text-white text-xs">✓</span>}
              </button>
              <div>
                <h4 className={`font-semibold ${goal.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                  {goal.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{goal.milestones?.length || 0} milestones</span>
                  <span>•</span>
                  <span>{goal._count?.actionItems || 0} actions</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-secondary rounded-lg">⚙️</button>
              <button 
                onClick={() => setGoals("DELETE", { id: goal.id })}
                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
