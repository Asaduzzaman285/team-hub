"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

export default function NewWorkspacePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/workspaces", { name, description, color });
      router.push(`/workspace/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-outfit">Create Workspace</h2>
        <p className="text-muted-foreground">Set up a new space for your team to collaborate.</p>
      </div>

      <div className="bg-card p-8 rounded-2xl border shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Workspace Name</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-xl border bg-background"
              placeholder="e.g. Marketing Team, Project Apollo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              className="w-full p-3 rounded-xl border bg-background min-h-[100px]"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Workspace Color</label>
            <div className="flex flex-wrap gap-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    color === c ? "ring-4 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
