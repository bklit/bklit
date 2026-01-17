"use client";

import type {
  LiveEvent,
  PageviewEvent,
  SessionEndEvent,
  TrackedEvent,
} from "@bklit/redis";
import { useCallback, useEffect, useRef, useState } from "react";

type EventHandler<T> = (data: T) => void;

interface UseLiveEventStreamOptions {
  onPageview?: EventHandler<PageviewEvent["data"]>;
  onEvent?: EventHandler<TrackedEvent["data"]>;
  onSessionEnd?: EventHandler<SessionEndEvent["data"]>;
  onConnected?: () => void;
  onError?: (error: string) => void;
}

interface UseLiveEventStreamReturn {
  isConnected: boolean;
  error: string | null;
}

// ============================================
// SINGLETON EVENT SOURCE MANAGER
// Only ONE EventSource per projectId, shared across all components
// ============================================

interface ProjectConnection {
  eventSource: EventSource;
  listeners: Set<(event: LiveEvent) => void>;
  connectionListeners: Set<(connected: boolean) => void>;
  isConnected: boolean;
  refCount: number;
}

const connections = new Map<string, ProjectConnection>();

function getOrCreateConnection(projectId: string): ProjectConnection {
  let connection = connections.get(projectId);

  if (!connection) {
    const eventSource = new EventSource(
      `/api/live-stream?projectId=${projectId}`
    );

    connection = {
      eventSource,
      listeners: new Set(),
      connectionListeners: new Set(),
      isConnected: false,
      refCount: 0,
    };

    const conn = connection; // Capture for closures

    eventSource.onopen = () => {
      conn.isConnected = true;
      conn.connectionListeners.forEach((cb) => cb(true));
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as
          | LiveEvent
          | { type: "connected" | "heartbeat" | "error"; message?: string };

        // Handle system messages
        if (event.type === "connected") {
          conn.isConnected = true;
          conn.connectionListeners.forEach((cb) => cb(true));
          return;
        }

        if (event.type === "heartbeat") {
          return;
        }

        if (event.type === "error") {
          conn.isConnected = false;
          conn.connectionListeners.forEach((cb) => cb(false));
          return;
        }

        // Broadcast to all listeners
        conn.listeners.forEach((cb) => cb(event as LiveEvent));
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      conn.isConnected = false;
      conn.connectionListeners.forEach((cb) => cb(false));
    };

    connections.set(projectId, connection);
  }

  connection.refCount++;
  return connection;
}

function releaseConnection(projectId: string) {
  const connection = connections.get(projectId);
  if (!connection) return;

  connection.refCount--;

  // Close connection when no more subscribers
  if (connection.refCount <= 0) {
    connection.eventSource.close();
    connections.delete(projectId);
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useLiveEventStream(
  projectId: string,
  options: UseLiveEventStreamOptions = {}
): UseLiveEventStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref up to date
  optionsRef.current = options;

  useEffect(() => {
    if (!projectId) return;

    const connection = getOrCreateConnection(projectId);

    // Set initial connection state
    setIsConnected(connection.isConnected);

    // Event listener
    const handleEvent = (event: LiveEvent) => {
      switch (event.type) {
        case "pageview":
          optionsRef.current.onPageview?.(event.data);
          break;
        case "event":
          optionsRef.current.onEvent?.(event.data);
          break;
        case "session_end":
          optionsRef.current.onSessionEnd?.(event.data);
          break;
      }
    };

    // Connection state listener
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
        optionsRef.current.onConnected?.();
      } else {
        setError("Connection lost - reconnecting...");
      }
    };

    // Subscribe
    connection.listeners.add(handleEvent);
    connection.connectionListeners.add(handleConnectionChange);

    return () => {
      // Unsubscribe
      connection.listeners.delete(handleEvent);
      connection.connectionListeners.delete(handleConnectionChange);
      releaseConnection(projectId);
    };
  }, [projectId]);

  return { isConnected, error };
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

export function useLivePageviews(
  projectId: string,
  onPageview: EventHandler<PageviewEvent["data"]>
): { isConnected: boolean } {
  const onPageviewRef = useRef(onPageview);
  onPageviewRef.current = onPageview;

  const stableOnPageview = useCallback((data: PageviewEvent["data"]) => {
    onPageviewRef.current(data);
  }, []);

  const { isConnected } = useLiveEventStream(projectId, {
    onPageview: stableOnPageview,
  });

  return { isConnected };
}

export function useLiveEvents(
  projectId: string,
  onEvent: EventHandler<TrackedEvent["data"]>
): { isConnected: boolean } {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const stableOnEvent = useCallback((data: TrackedEvent["data"]) => {
    onEventRef.current(data);
  }, []);

  const { isConnected } = useLiveEventStream(projectId, {
    onEvent: stableOnEvent,
  });

  return { isConnected };
}

export function useLiveSessionEnd(
  projectId: string,
  onSessionEnd: EventHandler<SessionEndEvent["data"]>
): { isConnected: boolean } {
  const onSessionEndRef = useRef(onSessionEnd);
  onSessionEndRef.current = onSessionEnd;

  const stableOnSessionEnd = useCallback((data: SessionEndEvent["data"]) => {
    onSessionEndRef.current(data);
  }, []);

  const { isConnected } = useLiveEventStream(projectId, {
    onSessionEnd: stableOnSessionEnd,
  });

  return { isConnected };
}
