"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import useAuthStore from "@/store/useAuthStore";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function AnnouncementsTab({ workspaceId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [commentingOn, setCommentingOn] = useState(null);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuthStore();
  const { on, off } = useSocket(workspaceId);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get(`/announcements/workspace/${workspaceId}`);
        setAnnouncements(data);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
    // ... (rest of listeners)

    on("announcement-created", (newAnn) => {
      setAnnouncements((prev) => {
        if (prev.find((a) => a.id === newAnn.id)) return prev;
        return [newAnn, ...prev];
      });
    });

    on("comment-added", ({ announcementId, comment }) => {
      setAnnouncements((prev) => 
        prev.map((a) => a.id === announcementId ? { ...a, comments: [...(a.comments || []), comment] } : a)
      );
    });

    on("reaction-added", ({ announcementId, reaction }) => {
      setAnnouncements((prev) => 
        prev.map((a) => a.id === announcementId ? { ...a, reactions: [...(a.reactions || []), reaction] } : a)
      );
    });

    on("reaction-removed", ({ announcementId, userId, emoji }) => {
      setAnnouncements((prev) => 
        prev.map((a) => a.id === announcementId ? { 
          ...a, 
          reactions: (a.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) 
        } : a)
      );
    });

    return () => {
      off("announcement-created");
      off("comment-added");
      off("reaction-added");
      off("reaction-removed");
    };
  }, [workspaceId, on, off]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await api.post("/announcements", {
        title: "Team Update",
        content: newContent,
        workspaceId
      });
      setNewContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (announcementId) => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/announcements/${announcementId}/comments`, { content: newComment });
      setNewComment("");
      setCommentingOn(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReaction = async (announcementId, emoji) => {
    try {
      await api.post(`/announcements/${announcementId}/reactions`, { emoji });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading feed...</div>;

  const REACTION_OPTIONS = ["❤️", "👍", "🙌", "🚀", "🎉"];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in">
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h3 className="text-xl font-bold font-outfit mb-4">Share a rich update</h3>
        <div className="mb-4">
          <ReactQuill 
            theme="snow" 
            value={newContent} 
            onChange={setNewContent}
            placeholder="What's happening in the team?"
            className="bg-background rounded-xl overflow-hidden"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button 
            onClick={handlePost}
            className="bg-primary text-primary-foreground px-8 py-2 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Post Update
          </button>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        {announcements.map((ann) => {
          const userReactions = ann.reactions?.filter(r => r.userId === user?.id).map(r => r.emoji) || [];
          
          return (
            <div key={ann.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {/* ... author info ... */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                      {ann.author?.avatar ? (
                        <img src={ann.author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        ann.author?.name?.[0]
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{ann.author?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {ann.isPinned && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-amber-200">
                      📌 PINNED
                    </span>
                  )}
                </div>
                <div 
                  className="text-foreground prose prose-sm max-w-none mb-6 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: ann.content }}
                />

                {/* Reactions Display */}
                {ann.reactions?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {REACTION_OPTIONS.map(emoji => {
                      const count = ann.reactions.filter(r => r.emoji === emoji).length;
                      if (count === 0) return null;
                      const isSelected = userReactions.includes(emoji);
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(ann.id, emoji)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                            isSelected ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-secondary/50 border-transparent hover:border-muted-foreground"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-4 border-t">
                  <button 
                    onClick={() => setCommentingOn(commentingOn === ann.id ? null : ann.id)}
                    className={`text-sm flex items-center space-x-2 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/50 ${
                      commentingOn === ann.id ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <span>💬</span>
                    <span>{ann.comments?.length || 0} Comments</span>
                  </button>
                  
                  {/* Quick Reaction Picker */}
                  <div className="flex items-center space-x-1 bg-secondary/30 p-1 rounded-xl">
                    {REACTION_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(ann.id, emoji)}
                        className={`hover:scale-125 transition-transform p-1 rounded-lg ${
                          userReactions.includes(emoji) ? "bg-primary/20" : "grayscale hover:grayscale-0"
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                {(commentingOn === ann.id || ann.comments?.length > 0) && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-dashed">
                    {ann.comments?.map((comment) => (
                      <div key={comment.id} className="flex space-x-3 group">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary flex items-center justify-center text-xs font-bold shrink-0 border border-border">
                          {comment.author?.avatar ? (
                            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            comment.author?.name?.[0]
                          )}
                        </div>
                        <div className="flex-1 bg-secondary/30 p-3 rounded-2xl group-hover:bg-secondary/50 transition-colors">
                          <p className="text-[11px] font-bold text-primary">{comment.author?.name}</p>
                          <p className="text-sm text-foreground/90">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {commentingOn === ann.id && (
                      <div className="flex space-x-2 pt-2 animate-in slide-in-from-top-2">
                        <input
                          autoFocus
                          className="flex-1 bg-background border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary shadow-inner"
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(ann.id)}
                        />
                        <button 
                          onClick={() => handleAddComment(ann.id)}
                          disabled={!newComment.trim()}
                          className="bg-primary text-primary-foreground px-4 py-1 rounded-xl text-xs font-bold disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
