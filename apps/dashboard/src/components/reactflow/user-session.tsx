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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { cleanUrl } from "@/lib/utils";

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
  const navigation = data.navigation as
    | Array<{ type: "from" | "to"; page: string; time?: number }>
    | undefined;
  const visitCount = data.visitCount as number | undefined;

  return (
    <div className="min-w-[280px]">
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3"
      />
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{data.title}</CardTitle>
          <div className="text-xs text-muted-foreground mt-1">
            {cleanUrl(data.url)}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>{data.timestamp}</span>
            </div>
          </div>

          {navigation && navigation.length > 0 ? (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Navigation
              </div>
              {visitCount && visitCount > 1 && (
                <div className="text-xs text-muted-foreground mb-2">
                  Visited {visitCount} times
                </div>
              )}
              <div className="space-y-1.5 text-xs">
                {navigation.map((item, idx) => {
                  if (item.type === "from") {
                    if (item.page === "Entry") {
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-muted-foreground"
                        >
                          <span className="font-semibold text-foreground">
                            Entry
                          </span>
                          {item.time !== undefined && (
                            <span className="text-muted-foreground/70">
                              {formatDuration(item.time)}
                            </span>
                          )}
                        </div>
                      );
                    }
                  }

                  if (item.type === "to") {
                    if (item.page === "Exit") {
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-muted-foreground"
                        >
                          <span className="font-semibold text-foreground">
                            Exit
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-muted-foreground"
                      >
                        <span className="font-medium">to:</span>
                        <span>{item.page}</span>
                      </div>
                    );
                  }

                  if (item.type === "from") {
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-muted-foreground"
                      >
                        <span>
                          <span className="font-medium">from:</span>{" "}
                          <span>{item.page}</span>
                        </span>
                        {item.time !== undefined && (
                          <span className="text-muted-foreground/70">
                            {formatDuration(item.time)}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3"
      />
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

// Helper function to generate nodes from session data
function generateNodesFromSession(session: SessionData): Node[] {
  if (session.pageViewEvents.length === 0) {
    return [];
  }

  // Create a map to track unique pages and their visit counts
  const pageVisits = new Map<
    string,
    {
      count: number;
      firstVisit: number;
      lastVisit: number;
      urls: string[];
      timeOnPage: number;
      column: number; // Track which column this page appears in
    }
  >();

  // Calculate time spent on each page
  const sessionEndTime = session.endedAt
    ? new Date(session.endedAt).getTime()
    : Date.now();

  session.pageViewEvents.forEach((pageView, index) => {
    const urlKey = cleanUrl(pageView.url, session.site.domain);
    const existing = pageVisits.get(urlKey);

    // Calculate time spent on this page visit
    const currentTime = new Date(pageView.timestamp).getTime();
    const nextPageView = session.pageViewEvents[index + 1];
    const nextTime = nextPageView
      ? new Date(nextPageView.timestamp).getTime()
      : sessionEndTime;
    const timeSpent = Math.floor((nextTime - currentTime) / 1000);

    if (existing) {
      existing.count++;
      existing.lastVisit = index;
      existing.timeOnPage += timeSpent;
      if (!existing.urls.includes(pageView.url)) {
        existing.urls.push(pageView.url);
      }
    } else {
      pageVisits.set(urlKey, {
        count: 1,
        firstVisit: index,
        lastVisit: index,
        urls: [pageView.url],
        timeOnPage: timeSpent,
        column: index, // First appearance determines column
      });
    }
  });

  // Helper to format page title
  const formatPageTitle = (key: string): string => {
    if (key === "/") return "Home";
    if (key === "") return "Root";
    return key;
  };

  // Generate chronological navigation sequence for each page
  const navigationSequences = new Map<
    string,
    Array<{ type: "from" | "to"; page: string; time?: number; index: number }>
  >();

  // Initialize navigation sequences
  pageVisits.forEach((_, urlKey) => {
    navigationSequences.set(urlKey, []);
  });

  // Track navigation flow chronologically with time spent
  for (let i = 0; i < session.pageViewEvents.length; i++) {
    const currentPage = session.pageViewEvents[i];
    if (!currentPage) continue;

    const currentUrlKey = cleanUrl(currentPage.url, session.site.domain);
    const currentNav = navigationSequences.get(currentUrlKey);
    if (!currentNav) continue;

    // Calculate time spent on this page
    const currentPageTime = new Date(currentPage.timestamp).getTime();
    const nextPage = session.pageViewEvents[i + 1];
    const leaveTime = nextPage
      ? new Date(nextPage.timestamp).getTime()
      : sessionEndTime;
    const timeSpent = Math.floor((leaveTime - currentPageTime) / 1000);

    // Add "from" entry
    if (i === 0) {
      // Entry page
      currentNav.push({
        type: "from",
        page: "Entry",
        time: timeSpent,
        index: i,
      });
    } else {
      // From previous page
      const prevPage = session.pageViewEvents[i - 1];
      if (prevPage) {
        const prevUrlKey = cleanUrl(prevPage.url, session.site.domain);
        if (prevUrlKey !== currentUrlKey) {
          currentNav.push({
            type: "from",
            page: formatPageTitle(prevUrlKey),
            time: timeSpent,
            index: i,
          });
        }
      }
    }

    // Add "to" entry
    if (nextPage) {
      const nextUrlKey = cleanUrl(nextPage.url, session.site.domain);
      if (nextUrlKey !== currentUrlKey) {
        currentNav.push({
          type: "to",
          page: formatPageTitle(nextUrlKey),
          index: i,
        });
      }
    } else {
      // Exit
      currentNav.push({
        type: "to",
        page: "Exit",
        index: i,
      });
    }
  }

  // Generate nodes for unique pages
  const nodes: Node[] = [];

  pageVisits.forEach((visits, urlKey) => {
    const pageView = session.pageViewEvents[visits.firstVisit];
    if (!pageView) return;

    const navSequence = navigationSequences.get(urlKey) || [];

    // Sort by index to maintain chronological order, then create a clean sequence
    const sortedSequence = navSequence
      .sort((a, b) => a.index - b.index)
      .map(({ type, page, time }) => ({ type, page, time }));

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
      position: { x: 0, y: 0 }, // Will be set by layout function
      data: {
        title,
        url: pageView.url,
        timestamp: format(new Date(pageView.timestamp), "HH:mm:ss"),
        location,
        visitors: "1",
        timeOnPage: formatDuration(visits.timeOnPage),
        preview: title,
        visitCount: visits.count,
        column: visits.column, // Store column for layout
        navigation: sortedSequence,
      },
    });
  });

  return nodes;
}

// Helper function to generate edges from session data
// Creates separate edges for each transition to avoid overlapping
function generateEdgesFromSession(session: SessionData): Edge[] {
  const edges: Edge[] = [];
  const transitionCounts = new Map<string, number>();
  const loopCounts = new Map<string, number>();

  // Track all transitions between pages sequentially
  for (let i = 0; i < session.pageViewEvents.length - 1; i++) {
    const currentPage = session.pageViewEvents[i];
    const nextPage = session.pageViewEvents[i + 1];

    if (!currentPage || !nextPage) continue;

    const currentUrlKey = cleanUrl(currentPage.url, session.site.domain);
    const nextUrlKey = cleanUrl(nextPage.url, session.site.domain);

    // Skip if same page (refresh)
    if (currentUrlKey === nextUrlKey) continue;

    // Create unique edge ID for each transition
    const edgeKey = `${currentUrlKey}->${nextUrlKey}`;
    const count = transitionCounts.get(edgeKey) || 0;
    transitionCounts.set(edgeKey, count + 1);

    // For repeated transitions, create unique ID with index
    const uniqueEdgeId = count > 0 ? `${edgeKey}-${count}` : edgeKey;

    // Determine if this is a loop (going back to a previous page)
    const isLoop =
      i > 0 &&
      session.pageViewEvents
        .slice(0, i)
        .some((prev) => cleanUrl(prev.url, session.site.domain) === nextUrlKey);

    // For loops, connect to top/bottom handles instead of left
    // Track loop count per target page to alternate handles
    let loopTargetHandle = "left";
    if (isLoop) {
      const loopCount = loopCounts.get(nextUrlKey) || 0;
      loopCounts.set(nextUrlKey, loopCount + 1);
      // Alternate between top and bottom for multiple loops to the same page
      loopTargetHandle = loopCount % 2 === 0 ? "top" : "bottom";
    }

    edges.push({
      id: uniqueEdgeId,
      source: currentUrlKey,
      sourceHandle: "right",
      target: nextUrlKey,
      targetHandle: loopTargetHandle,
      animated: true,
      type: "smoothstep",
      style: {
        stroke: isLoop ? "#8b5cf6" : "#6b7280",
        strokeWidth: 3,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: isLoop ? "#8b5cf6" : "#6b7280",
      },
    });
  }

  return edges;
}

// Layout function that positions nodes in columns based on visit sequence
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodeWidth = 300;
  const nodeHeight = 200;
  const columnSpacing = 400; // Horizontal spacing between columns
  const rowSpacing = 250; // Vertical spacing for nodes in same column

  // Group nodes by column (based on first visit order)
  const nodesByColumn = new Map<number, Node[]>();
  nodes.forEach((node) => {
    const column = node.data.column as number;
    if (!nodesByColumn.has(column)) {
      nodesByColumn.set(column, []);
    }
    const columnNodes = nodesByColumn.get(column);
    if (columnNodes) {
      columnNodes.push(node);
    }
  });

  // Position nodes in columns
  const layoutedNodes = nodes.map((node) => {
    const column = node.data.column as number;
    const nodesInColumn = nodesByColumn.get(column) || [];
    const indexInColumn = nodesInColumn.findIndex((n) => n.id === node.id);

    // Calculate x position based on column
    const x = column * columnSpacing;

    // Calculate y position - center nodes in column, or stack if multiple
    let y = 0;
    if (nodesInColumn.length === 1) {
      y = 0; // Center single node
    } else {
      // Stack multiple nodes vertically
      const totalHeight = (nodesInColumn.length - 1) * rowSpacing;
      const startY = -totalHeight / 2;
      y = startY + indexInColumn * rowSpacing;
    }

    return {
      ...node,
      position: {
        x: x - nodeWidth / 2, // Center the node
        y: y - nodeHeight / 2,
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
    <div className="w-full h-full">
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
    </div>
  );
}
