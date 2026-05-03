import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useAuthStore from "../store/useAuthStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

export const useSocket = (workspaceId) => {
  const socketRef = useRef();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to socket");
      // Always emit join-workspace so the server registers the personal
      // room (user:${id}) for notifications & invite events.
      // workspaceId is optional — only passed when on a workspace page.
      socketRef.current.emit("join-workspace", { workspaceId: workspaceId || null, user });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, workspaceId]);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    } else {
      // If socket isn't ready, we could queue it, but it's better to 
      // just expose the socket or ensure the effect has run.
      // For now, we'll just check if it's ready.
      console.warn(`Socket not ready for event: ${event}`);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return { socket: socketRef.current, emit, on, off };
};
