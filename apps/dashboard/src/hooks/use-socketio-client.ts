"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/env";

let globalSocket: Socket | null = null;
let connectionAttempted = false;

function getSocketClient(): Socket | null {
  if (typeof window === "undefined") return null;

  const wsUrl = env.NEXT_PUBLIC_WS_URL;

  if (!wsUrl) {
    if (!connectionAttempted) {
      console.info("ℹ️ WebSocket not configured - using polling fallback");
      connectionAttempted = true;
    }
    return null;
  }

  if (!globalSocket) {
    globalSocket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    globalSocket.on("connect", () => {
      console.log("✅ Real-time connected");
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("❌ Real-time disconnected:", reason);
    });
  }

  return globalSocket;
}

export function useSocketIOEvents<T = any>(
  projectId: string,
  eventType: string,
  onEvent: (data: T) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocketClient();
    if (!socket) return;

    socket.emit("join_project", projectId);
    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_project", projectId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleEvent = (data: T) => {
      onEventRef.current(data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(eventType, handleEvent);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(eventType, handleEvent);
      socket.emit("leave_project", projectId);
    };
  }, [projectId, eventType]);

  return { isConnected, isAvailable: !!getSocketClient() };
}
