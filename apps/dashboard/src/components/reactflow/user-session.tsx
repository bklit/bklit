"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type EdgeProps,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { format } from "date-fns";
import {
  ArrowUpFromDot,
  Clock,
  CornerDownRight,
  Eye,
  ImageUpscale,
  Timer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cleanUrl } from "@/lib/utils";

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

function WebPageNode({ data }: NodeProps) {
  const navigation = data.navigation as
    | Array<{ type: "from" | "to"; page: string; time?: number }>
    | undefined;
  const visitCount = data.visitCount as number | undefined;
  const opacity = data.opacity as number | undefined;

  return (
    <div
      className="min-w-[280px] transition-opacity duration-200"
      style={{ opacity: opacity ?? 1 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="sr-only"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="sr-only"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="sr-only"
      />
      <Card className="relative border-2">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold">{data.title}</CardTitle>
          <CardDescription>
            <code className="text-xs text-muted-foreground font-mono">
              {cleanUrl(data.url)}
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="size-3" />
              <span className="text-muted-foreground">{data.timestamp}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Eye className="size-3" />
              <span className="text-muted-foreground">
                Visited {visitCount} times
              </span>
            </div>
          </div>

          {navigation && navigation.length > 0 ? (
            <div className="border-t pt-3 text-xs">
              {navigation.map((item, idx) => {
                const needsSeparator =
                  item.type === "from" &&
                  idx > 0 &&
                  navigation[idx - 1]?.type === "to" &&
                  navigation[idx - 1]?.page !== item.page &&
                  navigation[idx - 1]?.page !== "Exit";

                const separator = needsSeparator ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <ArrowUpFromDot
                      size={12}
                      key={`separator-${idx}`}
                      className="rotate-180 text-muted-foreground/30"
                    />
                  </div>
                ) : null;

                if (item.type === "from") {
                  if (item.page === "Entry") {
                    return (
                      <Fragment key={idx}>
                        {separator}
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          <Badge variant="success">Entry</Badge>
                          {item.time !== undefined && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <Timer
                                  size={12}
                                  className="text-muted-foreground/30"
                                />
                              </div>
                              viewed for {formatDuration(item.time)}
                            </div>
                          )}
                        </div>
                      </Fragment>
                    );
                  }
                }

                if (item.type === "to") {
                  if (item.page === "Exit") {
                    return (
                      <Fragment key={idx}>
                        {separator}
                        <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <CornerDownRight size={14} className="ml-2" />
                          </div>
                          <Badge variant="destructive">Exit</Badge>
                        </div>
                      </Fragment>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className="flex flex-row items-center gap-2 text-muted-foreground"
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        <CornerDownRight size={14} className="ml-2" />
                      </div>
                      <span>{item.page}</span>
                    </div>
                  );
                }

                if (item.type === "from") {
                  return (
                    <Fragment key={idx}>
                      {separator}
                      <div className="flex flex-col gap-1">
                        <Badge variant="alternative">
                          <span className="text-xs font-medium opacity-60">
                            from
                          </span>{" "}
                          <span>{item.page}</span>
                        </Badge>
                        {item.time !== undefined && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-6 h-6 flex items-center justify-center">
                              <Timer
                                size={12}
                                className="text-muted-foreground/30"
                              />
                            </div>
                            viewed for {formatDuration(item.time)}
                          </div>
                        )}
                      </div>
                    </Fragment>
                  );
                }

                return null;
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="sr-only"
      />
    </div>
  );
}

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

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ") || "0s";
}

function generateNodesFromSession(session: SessionData): Node[] {
  if (session.pageViewEvents.length === 0) {
    return [];
  }

  const pageVisits = new Map<
    string,
    {
      count: number;
      firstVisit: number;
      lastVisit: number;
      urls: string[];
      timeOnPage: number;
      column: number;
    }
  >();

  const sessionEndTime = session.endedAt
    ? new Date(session.endedAt).getTime()
    : Date.now();

  let uniqueColumnCounter = 0;

  session.pageViewEvents.forEach((pageView, index) => {
    const urlKey = cleanUrl(pageView.url, session.site.domain);
    const existing = pageVisits.get(urlKey);

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
        column: uniqueColumnCounter++,
      });
    }
  });

  const formatPageTitle = (key: string): string => {
    if (key === "/") return "Home";
    if (key === "") return "Root";
    return key;
  };

  const navigationSequences = new Map<
    string,
    Array<{ type: "from" | "to"; page: string; time?: number; index: number }>
  >();

  pageVisits.forEach((_, urlKey) => {
    navigationSequences.set(urlKey, []);
  });

  for (let i = 0; i < session.pageViewEvents.length; i++) {
    const currentPage = session.pageViewEvents[i];
    if (!currentPage) continue;

    const currentUrlKey = cleanUrl(currentPage.url, session.site.domain);
    const currentNav = navigationSequences.get(currentUrlKey);
    if (!currentNav) continue;

    const currentPageTime = new Date(currentPage.timestamp).getTime();
    const nextPage = session.pageViewEvents[i + 1];
    const leaveTime = nextPage
      ? new Date(nextPage.timestamp).getTime()
      : sessionEndTime;
    const timeSpent = Math.floor((leaveTime - currentPageTime) / 1000);

    if (i === 0) {
      currentNav.push({
        type: "from",
        page: "Entry",
        time: timeSpent,
        index: i,
      });
    } else {
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
      currentNav.push({
        type: "to",
        page: "Exit",
        index: i,
      });
    }
  }

  const nodes: Node[] = [];
  const lastPageViewIndex = session.pageViewEvents.length - 1;
  const lastPageView = session.pageViewEvents[lastPageViewIndex];
  const lastPageUrlKey = lastPageView
    ? cleanUrl(lastPageView.url, session.site.domain)
    : null;
  const firstPageView = session.pageViewEvents[0];
  const firstPageUrlKey = firstPageView
    ? cleanUrl(firstPageView.url, session.site.domain)
    : null;
  const isExitAlsoEntry = lastPageUrlKey === firstPageUrlKey;

  pageVisits.forEach((visits, urlKey) => {
    const pageView = session.pageViewEvents[visits.firstVisit];
    if (!pageView) return;

    const navSequence = navigationSequences.get(urlKey) || [];

    const sortedSequence = navSequence
      .sort((a, b) => a.index - b.index)
      .map(({ type, page, time }) => ({ type, page, time }));

    const location =
      [session.country, session.city].filter(Boolean).join(", ") ||
      "Unknown location";

    let title = urlKey;
    if (urlKey === "/") title = "Home";
    else if (urlKey === "") title = "Root";

    const isExitPage = urlKey === lastPageUrlKey;

    nodes.push({
      id: urlKey,
      type: "webPage",
      position: { x: 0, y: 0 },
      data: {
        title,
        url: pageView.url,
        timestamp: format(new Date(pageView.timestamp), "PPp"),
        location,
        visitors: "1",
        timeOnPage: formatDuration(visits.timeOnPage),
        preview: title,
        visitCount: visits.count,
        column: visits.column,
        row: isExitPage && !isExitAlsoEntry ? 1 : 0,
        isExitPage,
        isExitAlsoEntry,
        navigation: sortedSequence,
      },
    });
  });

  return nodes;
}

function generateEdgesFromSession(session: SessionData): Edge[] {
  const edges: Edge[] = [];
  const transitionCounts = new Map<string, number>();
  const loopCounts = new Map<string, number>();

  const lastPageViewIndex = session.pageViewEvents.length - 1;
  const lastPageView = session.pageViewEvents[lastPageViewIndex];
  const lastPageUrlKey = lastPageView
    ? cleanUrl(lastPageView.url, session.site.domain)
    : null;

  for (let i = 0; i < session.pageViewEvents.length - 1; i++) {
    const currentPage = session.pageViewEvents[i];
    const nextPage = session.pageViewEvents[i + 1];

    if (!currentPage || !nextPage) continue;

    const currentUrlKey = cleanUrl(currentPage.url, session.site.domain);
    const nextUrlKey = cleanUrl(nextPage.url, session.site.domain);

    if (currentUrlKey === nextUrlKey) continue;

    const isLastTransition = i === lastPageViewIndex - 1;
    const targetUrlKey = isLastTransition ? lastPageUrlKey : nextUrlKey;

    if (!targetUrlKey) continue;

    const edgeKey = `${currentUrlKey}->${targetUrlKey}`;
    const count = transitionCounts.get(edgeKey) || 0;
    transitionCounts.set(edgeKey, count + 1);

    const uniqueEdgeId = count > 0 ? `${edgeKey}-${count}` : edgeKey;

    const isLoop =
      i > 0 &&
      session.pageViewEvents
        .slice(0, i)
        .some((prev) => cleanUrl(prev.url, session.site.domain) === nextUrlKey);

    let loopTargetHandle = "left";
    if (isLoop) {
      const loopCount = loopCounts.get(targetUrlKey) || 0;
      loopCounts.set(targetUrlKey, loopCount + 1);
      loopTargetHandle = loopCount % 2 === 0 ? "top" : "bottom";
    }

    if (isLastTransition) {
      edges.push({
        id: `${uniqueEdgeId}->exit`,
        source: currentUrlKey,
        sourceHandle: "right",
        target: targetUrlKey,
        targetHandle: "bottom",
        animated: true,
        type: "smoothstep",
        style: {
          stroke: "var(--bklit-300)",
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "var(--bklit-300)",
        },
      });
    } else {
      edges.push({
        id: uniqueEdgeId,
        source: currentUrlKey,
        sourceHandle: "right",
        target: targetUrlKey,
        targetHandle: loopTargetHandle,
        animated: true,
        type: "smoothstep",
        style: {
          stroke: isLoop ? "var(--primary)" : "var(--bklit-300)",
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isLoop ? "var(--primary)" : "var(--bklit-300)",
        },
      });
    }
  }

  return edges;
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodeWidth = 300;
  const nodeHeight = 200;
  const columnSpacing = 400;
  const rowSpacing = 250;

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

  const regularNodes = nodes.filter(
    (n) =>
      !(n.data.isExitPage as boolean) || (n.data.isExitAlsoEntry as boolean),
  );
  const exitNode = nodes.find(
    (n) =>
      (n.data.isExitPage as boolean) && !(n.data.isExitAlsoEntry as boolean),
  );

  const sortedRegularNodes = [...regularNodes].sort(
    (a, b) => (a.data.column as number) - (b.data.column as number),
  );

  const layoutedRegularNodes = sortedRegularNodes.map((node) => {
    const column = node.data.column as number;
    const row = node.data.row as number;
    const verticalOffset = column * 80;

    const x = column * columnSpacing;
    const y = row * rowSpacing + verticalOffset;

    return {
      ...node,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
    };
  });

  let layoutedNodes = layoutedRegularNodes;

  if (exitNode) {
    const exitColumn = exitNode.data.column as number;
    const verticalOffset = exitColumn * 80;
    const x = exitColumn * columnSpacing;
    const y = rowSpacing + verticalOffset;

    layoutedNodes = [
      ...layoutedRegularNodes,
      {
        ...exitNode,
        position: {
          x: x - nodeWidth / 2,
          y: y - nodeHeight / 2,
        },
      },
    ];
  }

  return { nodes: layoutedNodes, edges };
}

function UserSessionInner({ session }: UserSessionProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

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

  const nodesWithOpacity = useMemo(() => {
    if (hoveredEdgeId) {
      const hoveredEdge = layoutedEdges.find((e) => e.id === hoveredEdgeId);
      if (hoveredEdge) {
        const relatedNodeIds = new Set([
          hoveredEdge.source,
          hoveredEdge.target,
        ]);
        return layoutedNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            opacity: relatedNodeIds.has(node.id) ? 1 : 0.3,
          },
        }));
      }
    }

    return layoutedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        opacity: 1,
      },
    }));
  }, [layoutedNodes, layoutedEdges, hoveredEdgeId]);

  const edgesWithOpacity = useMemo(() => {
    if (hoveredEdgeId) {
      return layoutedEdges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: edge.id === hoveredEdgeId ? 1 : 0.3,
        },
      }));
    }

    return layoutedEdges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: 1,
      },
    }));
  }, [layoutedEdges, hoveredEdgeId]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodesWithOpacity);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edgesWithOpacity);

  useEffect(() => {
    setNodes(nodesWithOpacity);
  }, [nodesWithOpacity, setNodes]);

  useEffect(() => {
    setEdges(edgesWithOpacity);
  }, [edgesWithOpacity, setEdges]);

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

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, maxZoom: 1.5 });
  }, [fitView]);

  return (
    <div className="w-full relative border-2 rounded-xl overflow-clip h-[720px]">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onEdgeMouseEnter={(_event, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Panel position="top-right">
          <ButtonGroup orientation="horizontal">
            <Button variant="secondary" onClick={handleZoomIn}>
              <ZoomIn size={16} />
            </Button>
            <Button variant="secondary" onClick={handleZoomOut}>
              <ZoomOut size={16} />
            </Button>
            <Button variant="secondary" onClick={handleFitView}>
              <ImageUpscale size={16} />
            </Button>
          </ButtonGroup>
        </Panel>
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--bklit-300)"
          className="bg-white dark:bg-bklit-600"
        />
      </ReactFlow>
    </div>
  );
}

export function UserSession({ session }: UserSessionProps) {
  return (
    <ReactFlowProvider>
      <UserSessionInner session={session} />
    </ReactFlowProvider>
  );
}
