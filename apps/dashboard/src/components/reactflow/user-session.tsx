"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type EdgeProps,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import dagre from "dagre";
import { format } from "date-fns";
import { Clock, TrendingDown, Users } from "lucide-react";

// Types for session data
interface PageViewEvent {
  id: string;
  url: string;
  timestamp: Date;
  country: string | null;
  city: string | null;
}

interface SessionData {
  id: string;
  sessionId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  didBounce: boolean;
  entryPage: string;
  exitPage: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  visitorId: string | null;
  pageViewEvents: PageViewEvent[];
  site: {
    name: string;
    domain: string | null;
  };
}

interface UserSessionProps {
  session: SessionData;
}

// Custom node component for web pages
function WebPageNode({ data }: NodeProps) {
  return (
    <div className="min-w-[280px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {data.title}
            </CardTitle>
            <Badge
              variant={
                data.type === "entry"
                  ? "default"
                  : data.type === "exit"
                    ? "destructive"
                    : "secondary"
              }
            >
              {data.type}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{data.url}</div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>{data.timestamp}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3 h-3" />
              <span>{data.location}</span>
            </div>
            {data.avgTime && (
              <div className="flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3" />
                <span>{data.avgTime} on page</span>
              </div>
            )}
          </div>
          <div className="mt-3 h-16 bg-muted rounded border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">
            {data.preview}
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

// Custom edge with conversion rate
function ConversionEdge({ data }: EdgeProps) {
  return (
    <div className="bg-background border rounded px-2 py-1 text-xs font-medium shadow-sm">
      {data.rate}%
    </div>
  );
}

const nodeTypes = {
  webPage: WebPageNode,
};

const edgeTypes = {
  conversion: ConversionEdge,
};

// Helper function to format duration
function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

// Helper function to get a unique key for a URL
function getUrlKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || "/";
  } catch {
    return url;
  }
}

// Helper function to generate nodes from session data with dagre layout
function generateNodesFromSession(session: SessionData): Node[] {
  if (session.pageViewEvents.length === 0) {
    return [];
  }

  // Create a map to track unique pages and their visit counts
  const pageVisits = new Map<
    string,
    { count: number; firstVisit: number; lastVisit: number; urls: string[] }
  >();

  session.pageViewEvents.forEach((pageView, index) => {
    const urlKey = getUrlKey(pageView.url);
    const existing = pageVisits.get(urlKey);

    if (existing) {
      existing.count++;
      existing.lastVisit = index;
      if (!existing.urls.includes(pageView.url)) {
        existing.urls.push(pageView.url);
      }
    } else {
      pageVisits.set(urlKey, {
        count: 1,
        firstVisit: index,
        lastVisit: index,
        urls: [pageView.url],
      });
    }
  });

  // Generate nodes for unique pages
  const nodes: Node[] = [];

  pageVisits.forEach((visits, urlKey) => {
    const pageView = session.pageViewEvents[visits.firstVisit];
    if (!pageView) return;

    const isFirst = visits.firstVisit === 0;
    const isLast = visits.lastVisit === session.pageViewEvents.length - 1;

    let type: "entry" | "browse" | "exit";
    if (isFirst) type = "entry";
    else if (isLast) type = "exit";
    else type = "browse";

    const location =
      [session.country, session.city].filter(Boolean).join(", ") ||
      "Unknown location";

    // Use the URL pathname as the title, or the full URL if no pathname
    let title = urlKey;
    if (urlKey === "/") title = "Home";
    else if (urlKey === "") title = "Root";

    // Add visit count if more than 1
    if (visits.count > 1) {
      title += ` (${visits.count}x)`;
    }

    nodes.push({
      id: urlKey,
      type: "webPage",
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        title,
        url: pageView.url,
        type,
        timestamp: format(new Date(pageView.timestamp), "HH:mm:ss"),
        location,
        visitors: "1",
        avgTime: "0s",
        preview: title,
        visitCount: visits.count,
      },
    });
  });

  return nodes;
}

// Helper function to generate edges from session data with bidirectional support
function generateEdgesFromSession(session: SessionData): Edge[] {
  const edges: Edge[] = [];
  const edgeMap = new Map<
    string,
    {
      count: number;
      totalTime: number;
      lastTime: number;
      bidirectional: boolean;
    }
  >();

  // Track all transitions between pages
  for (let i = 0; i < session.pageViewEvents.length - 1; i++) {
    const currentPage = session.pageViewEvents[i];
    const nextPage = session.pageViewEvents[i + 1];

    if (!currentPage || !nextPage) continue;

    const currentUrlKey = getUrlKey(currentPage.url);
    const nextUrlKey = getUrlKey(nextPage.url);

    // Skip if same page (refresh)
    if (currentUrlKey === nextUrlKey) continue;

    // Create a consistent edge key (alphabetical order to avoid duplicates)
    const [firstKey, secondKey] = [currentUrlKey, nextUrlKey].sort();
    const edgeKey = `${firstKey}->${secondKey}`;

    // Calculate time difference
    const timeDiff = Math.floor(
      (new Date(nextPage.timestamp).getTime() -
        new Date(currentPage.timestamp).getTime()) /
        1000,
    );

    if (edgeMap.has(edgeKey)) {
      const existing = edgeMap.get(edgeKey);
      if (existing) {
        existing.count++;
        existing.totalTime += timeDiff;
        existing.lastTime = timeDiff;
        existing.bidirectional = true;
      }
    } else {
      edgeMap.set(edgeKey, {
        count: 1,
        totalTime: timeDiff,
        lastTime: timeDiff,
        bidirectional: false,
      });
    }
  }

  // Create edges with bidirectional markers
  edgeMap.forEach((data, edgeKey) => {
    const edgeParts = edgeKey.split("->");
    const source = edgeParts[0];
    const target = edgeParts[1];

    if (!source || !target) return;

    const avgTime = Math.round(data.totalTime / data.count);
    const label =
      data.count > 1
        ? `${data.count}x (${formatDuration(avgTime)})`
        : formatDuration(data.lastTime);

    edges.push({
      id: edgeKey,
      source,
      target,
      label,
      labelStyle: { fontSize: 12, fontWeight: 600 },
      type: "smoothstep",
      style: {
        stroke: data.bidirectional ? "#8b5cf6" : "#6b7280",
        strokeWidth: 3,
        strokeDasharray: "5,5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: data.bidirectional ? "#8b5cf6" : "#6b7280",
      },
      markerStart: data.bidirectional
        ? {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#8b5cf6",
          }
        : undefined,
    });
  });

  return edges;
}

// Dagre layout function
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  // Set nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 300, height: 200 });
  });

  // Set edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 150, // Center the node
        y: nodeWithPosition.y - 100,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function UserSession({ session }: UserSessionProps) {
  const [height, setHeight] = useState(640);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const initialNodes = useMemo(
    () => generateNodesFromSession(session),
    [session],
  );
  const initialEdges = useMemo(
    () => generateEdgesFromSession(session),
    [session],
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges],
  );

  const [nodesState, , onNodesChange] = useNodesState(layoutedNodes);
  const [edgesState, , onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edgesState);
      const newEdge = newEdges[newEdges.length - 1];
      if (newEdge) {
        onEdgesChange([{ type: "add", item: newEdge }]);
      }
    },
    [edgesState, onEdgesChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [height],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const deltaY = e.clientY - startY.current;
    const newHeight = Math.max(
      200,
      Math.min(1000, startHeight.current + deltaY),
    );
    setHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className="w-full bg-background relative"
      style={{ height: `${height}px` }}
    >
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
      <button
        className="absolute -bottom-1 left-0 w-full h-1 bg-border/60 cursor-ns-resize transition border-0 p-0 hover:bg-primary/70 active:bg-primary "
        onMouseDown={handleMouseDown}
        aria-label="Resize handle"
        type="button"
      />
    </div>
  );
}
