"use client";

import { useEffect, useRef } from "react";

type LiveEventType = "pageview" | "event" | "session_end";

interface LiveEventData {
  type: LiveEventType;
  timestamp: string;
  data: Record<string, unknown>;
  projectId?: string;
}

interface ProjectConnection {
  ws: WebSocket;
  listeners: Set<(data: LiveEventData) => void>;
  connectionListeners: Set<(isConnected: boolean) => void>;
  isConnected: boolean;
  refCount: number;
}

const connections = new Map<string, ProjectConnection>();

function getOrCreateConnection(projectId: string): ProjectConnection {
  let connection = connections.get(projectId);

  if (!connection) {
    // Determine WebSocket URL based on environment
    const wsHost =
      process.env.NODE_ENV === "development"
        ? "ws://localhost:8080"
        : "wss://bklit.ws";
    
    const ws = new WebSocket(`${wsHost}/dashboard?projectId=${projectId}`);

    connection = {
      ws,
      listeners: new Set(),
      connectionListeners: new Set(),
      isConnected: false,
      refCount: 0,
    };

    const conn = connection; // Capture for closures

    ws.onopen = () => {
      console.log(`[WebSocket] Connected to project ${projectId}`);
      conn.isConnected = true;
      conn.connectionListeners.forEach((cb) => cb(true));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === "connected") {
          console.log(`[WebSocket] Connection confirmed for project ${projectId}`);
          return;
        }

        // Forward the event to all listeners
        conn.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[WebSocket] Error for project ${projectId}:`, error);
      conn.isConnected = false;
      conn.connectionListeners.forEach((cb) => cb(false));
    };

    ws.onclose = () => {
      console.log(`[WebSocket] Disconnected from project ${projectId}`);
      conn.isConnected = false;
      conn.connectionListeners.forEach((cb) => cb(false));

      // Attempt to reconnect after a delay if there are still active listeners
      setTimeout(() => {
        if (conn.refCount > 0) {
          console.log(`[WebSocket] Reconnecting to project ${projectId}...`);
          connections.delete(projectId);
          getOrCreateConnection(projectId);
          
          // Re-add all existing listeners to new connection
          const newConn = connections.get(projectId);
          if (newConn) {
            conn.listeners.forEach((listener) => {
              newConn.listeners.add(listener);
            });
            conn.connectionListeners.forEach((listener) => {
              newConn.connectionListeners.add(listener);
            });
            newConn.refCount = conn.refCount;
          }
        }
      }, 3000); // Reconnect after 3 seconds
    };

    connections.set(projectId, connection);
  }

  return connection;
}

interface UseLiveEventStreamOptions {
  onPageview?: (data: any) => void;
  onEvent?: (data: any) => void;
  onSessionEnd?: (data: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function useLiveEventStream(
  projectId: string,
  options: UseLiveEventStreamOptions
) {
  const { onPageview, onEvent, onSessionEnd, onConnectionChange } = options;

  // Use refs to avoid recreating listeners on every render
  const onPageviewRef = useRef(onPageview);
  const onEventRef = useRef(onEvent);
  const onSessionEndRef = useRef(onSessionEnd);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Update refs when callbacks change
  useEffect(() => {
    onPageviewRef.current = onPageview;
    onEventRef.current = onEvent;
    onSessionEndRef.current = onSessionEnd;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onPageview, onEvent, onSessionEnd, onConnectionChange]);

  useEffect(() => {
    if (!projectId) return;

    const connection = getOrCreateConnection(projectId);
    connection.refCount++;

    // Create listener function
    const listener = (data: LiveEventData) => {
      if (data.type === "pageview" && onPageviewRef.current) {
        onPageviewRef.current(data.data);
      } else if (data.type === "event" && onEventRef.current) {
        onEventRef.current(data.data);
      } else if (data.type === "session_end" && onSessionEndRef.current) {
        onSessionEndRef.current(data.data);
      }
    };

    // Create connection listener
    const connectionListener = (isConnected: boolean) => {
      if (onConnectionChangeRef.current) {
        onConnectionChangeRef.current(isConnected);
      }
    };

    // Add listeners
    connection.listeners.add(listener);
    connection.connectionListeners.add(connectionListener);

    // Notify initial connection state
    if (onConnectionChangeRef.current) {
      onConnectionChangeRef.current(connection.isConnected);
    }

    // Cleanup
    return () => {
      connection.listeners.delete(listener);
      connection.connectionListeners.delete(connectionListener);
      connection.refCount--;

      // Close connection if no more listeners
      if (connection.refCount === 0) {
        console.log(`[WebSocket] Closing connection to project ${projectId} (no more listeners)`);
        connection.ws.close();
        connections.delete(projectId);
      }
    };
  }, [projectId]);

  return {
    isConnected: connections.get(projectId)?.isConnected ?? false,
  };
}
