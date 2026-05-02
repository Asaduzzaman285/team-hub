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
      if (workspaceId) {
        socketRef.current.emit("join-workspace", { workspaceId, user });
      }
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
    }
  };

  const off = (event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  return { emit, on, off };
};
