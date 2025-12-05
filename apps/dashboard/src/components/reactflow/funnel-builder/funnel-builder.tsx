"use client";

import { Button } from "@bklit/ui/components/button";
import { cn } from "@bklit/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeTypes,
  type OnConnectEnd,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  ImageUpscale,
  Maximize2,
  Minimize2,
  Plus,
  SquareChartGantt,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AddStepNode } from "./add-step-node";
import { FunnelSettingsSheet } from "./funnel-settings-sheet";
import { FunnelStepNode } from "./funnel-step-node";
import { StepConfigSheet } from "./step-config-sheet";

export type StepType = "pageview" | "event";

export interface StepData {
  type: StepType;
  name: string;
  url?: string;
  eventName?: string;
  eventCode?: string;
}

export interface FunnelNode extends Node {
  data: {
    label: string;
    stepData?: StepData;
    onConfigure: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    isConfigured: boolean;
    isEditing?: boolean;
    isFirstNode?: boolean;
  };
}

const nodeTypes: NodeTypes = {
  funnelStep: FunnelStepNode,
  addStep: AddStepNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FunnelBuilderInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingStepData, setEditingStepData] = useState<Partial<StepData>>({});
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const pendingAddStepNodeId = useRef<string | null>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  // Prevent edge deletion - only allow edges to be removed when target node is deleted
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Filter out delete operations - edges can only be removed when nodes are deleted
      const filteredChanges = changes.filter(
        (change) => change.type !== "remove",
      );
      if (filteredChanges.length > 0) {
        onEdgesChange(filteredChanges);
      }
    },
    [onEdgesChange],
  );

  const handleConfigure = useCallback(
    (nodeId: string) => {
      // Clear pending node tracking if editing an existing node
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.id !== pendingAddStepNodeId.current) {
        pendingAddStepNodeId.current = null;
      }
      setSelectedNodeId(nodeId);
      setSheetOpen(true);
    },
    [nodes],
  );

  const handleDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const filtered = nds.filter((n) => n.id !== nodeId);
        // If we're deleting the last node, add a new initial node
        if (filtered.length === 0) {
          const newNodeId = `step-${Date.now()}`;
          return [
            {
              id: newNodeId,
              type: "addStep",
              position: { x: 0, y: 0 },
              data: {
                label: "Add Step",
                onConfigure: handleConfigure,
                onDelete: handleDelete,
                isConfigured: false,
                isFirstNode: true,
              },
            },
          ];
        }
        return filtered;
      });
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [setNodes, setEdges, handleConfigure],
  );

  // Initialize with one node if empty
  useEffect(() => {
    if (nodes.length === 0) {
      const initialNodeId = `step-${Date.now()}`;
      const initialNode: Node = {
        id: initialNodeId,
        type: "addStep",
        position: { x: 0, y: 0 },
        data: {
          label: "Add Step",
          onConfigure: handleConfigure,
          onDelete: handleDelete,
          isConfigured: false,
          isFirstNode: true,
        },
      };
      setNodes([initialNode]);
    }
  }, [nodes.length, setNodes, handleConfigure, handleDelete]);

  const updateNodeDataLive = useCallback(
    (nodeId: string, partialData: Partial<StepData>) => {
      setEditingStepData(partialData);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                stepData: {
                  ...node.data.stepData,
                  ...partialData,
                },
                isEditing: true,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent connection if source already has an outgoing edge
      if (params.source) {
        const hasOutgoingEdge = edges.some((e) => e.source === params.source);
        if (hasOutgoingEdge) {
          return;
        }
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { strokeWidth: 2, strokeDasharray: "5,5" },
            animated: true,
          },
          eds,
        ),
      );
    },
    [setEdges, edges],
  );

  // Shared function to create a new step node
  const createNewStepNode = useCallback(
    (options?: {
      sourceNodeId?: string | null;
      position?: { x: number; y: number };
    }) => {
      // Check if there's already an addStep node - if so, don't create a new one
      const existingAddStepNode = nodes.find((n) => n.type === "addStep");
      if (existingAddStepNode) {
        // Just open the sheet for the existing addStep node
        handleConfigure(existingAddStepNode.id);
        return;
      }

      const newNodeId = `step-${Date.now()}`;
      let sourceNodeId = options?.sourceNodeId;
      let newPosition = options?.position;

      // If no position provided, calculate from last step
      if (!newPosition) {
        const configuredSteps = nodes.filter((n) => n.type === "funnelStep");
        const lastStep =
          configuredSteps.find((step) => {
            return !edges.some((e) => e.source === step.id);
          }) || configuredSteps[configuredSteps.length - 1];

        if (lastStep) {
          newPosition = {
            x: lastStep.position.x + 300,
            y: lastStep.position.y,
          };
          // If no source provided, use the last step
          if (!sourceNodeId) {
            sourceNodeId = lastStep.id;
          }
        } else {
          newPosition = { x: 0, y: 0 };
        }
      }

      const newNode: Node = {
        id: newNodeId,
        type: "addStep",
        position: newPosition,
        data: {
          label: "Add Step",
          onConfigure: handleConfigure,
          onDelete: handleDelete,
          isConfigured: false,
          isFirstNode: false,
        },
      };

      setNodes((nds) => nds.concat(newNode));

      // Create edge if we have a source node
      if (sourceNodeId) {
        setEdges((eds) => {
          const edgeId = `e-${sourceNodeId}-${newNodeId}`;
          const edgeExists = eds.some((e) => e.id === edgeId);

          if (!edgeExists) {
            return eds.concat({
              id: edgeId,
              source: sourceNodeId,
              target: newNodeId,
              style: { strokeWidth: 2, strokeDasharray: "5,5" },
              animated: true,
            });
          }

          return eds;
        });
      }

      // Track this as a pending addStep node (will be deleted if sheet closes without saving)
      pendingAddStepNodeId.current = newNodeId;

      // Open the configuration sheet for the new node
      setTimeout(() => {
        setSelectedNodeId(newNodeId);
        setSheetOpen(true);
        setEditingStepData({});
      }, 100);
    },
    [nodes, edges, setNodes, setEdges, handleConfigure, handleDelete],
  );

  const onConnectStart = useCallback(
    (_: unknown, { nodeId }: { nodeId: string | null }) => {
      // Prevent starting connection if node already has an outgoing edge
      if (nodeId) {
        const hasOutgoingEdge = edges.some((e) => e.source === nodeId);
        if (hasOutgoingEdge) {
          return;
        }
      }
      connectingNodeId.current = nodeId;
    },
    [edges],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;

      // Prevent creating new node if source already has an outgoing edge
      const hasOutgoingEdge = edges.some(
        (e) => e.source === connectingNodeId.current,
      );
      if (hasOutgoingEdge) {
        connectingNodeId.current = null;
        return;
      }

      const targetIsPane = (event.target as HTMLElement).classList.contains(
        "react-flow__pane",
      );

      if (targetIsPane) {
        const clientX =
          "clientX" in event
            ? event.clientX
            : ((event as TouchEvent).touches[0]?.clientX ?? 0);
        const clientY =
          "clientY" in event
            ? event.clientY
            : ((event as TouchEvent).touches[0]?.clientY ?? 0);

        const position = screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        createNewStepNode({
          sourceNodeId: connectingNodeId.current,
          position: {
            x: position.x - 100,
            y: position.y - 40,
          },
        });
      }

      connectingNodeId.current = null;
    },
    [screenToFlowPosition, createNewStepNode, edges],
  );

  const handleSaveStep = useCallback(
    (stepData: StepData) => {
      if (selectedNodeId) {
        // Calculate the last step ID before updating state
        const configuredSteps = nodes.filter(
          (n) => n.type === "funnelStep" && n.id !== selectedNodeId,
        );
        const lastStep =
          configuredSteps.find((step) => {
            return !edges.some((e) => e.source === step.id);
          }) || configuredSteps[configuredSteps.length - 1];

        const configuredCount = nodes.filter(
          (n) => n.type === "funnelStep",
        ).length;
        const isFirstNode = configuredCount === 0;
        const shouldCreateEdge =
          !isFirstNode && lastStep && lastStep.id !== selectedNodeId;

        // Update nodes
        setNodes((nds) => {
          const currentNode = nds.find((n) => n.id === selectedNodeId);
          let newPosition = currentNode?.position;

          if (shouldCreateEdge && lastStep) {
            // Position the new node to the right of the last step
            newPosition = {
              x: lastStep.position.x + 300,
              y: lastStep.position.y,
            };
          }

          return nds.map((node) => {
            if (node.id === selectedNodeId) {
              return {
                ...node,
                type: "funnelStep",
                position: newPosition || node.position,
                data: {
                  ...node.data,
                  label: stepData.name,
                  stepData,
                  isConfigured: true,
                  isEditing: false,
                  isFirstNode,
                  onConfigure: handleConfigure,
                  onDelete: handleDelete,
                },
              };
            }
            if (node.type === "funnelStep") {
              return {
                ...node,
                data: {
                  ...node.data,
                  isFirstNode: false,
                },
              };
            }
            return node;
          });
        });

        // Update edges to connect the new step
        if (shouldCreateEdge && lastStep) {
          setEdges((eds) => {
            const edgeId = `e-${lastStep.id}-${selectedNodeId}`;
            const edgeExists = eds.some((e) => e.id === edgeId);

            if (!edgeExists) {
              return eds.concat({
                id: edgeId,
                source: lastStep.id,
                target: selectedNodeId,
                style: { strokeWidth: 2, strokeDasharray: "5,5" },
                animated: true,
              });
            }

            return eds;
          });
        }

        // Clear pending node tracking since we saved
        pendingAddStepNodeId.current = null;
      }
      setSheetOpen(false);
      setSelectedNodeId(null);
      setEditingStepData({});
    },
    [
      selectedNodeId,
      nodes,
      edges,
      setNodes,
      setEdges,
      handleConfigure,
      handleDelete,
    ],
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (!open) {
        // If closing sheet and we have a pending addStep node, delete it
        if (
          pendingAddStepNodeId.current &&
          selectedNodeId === pendingAddStepNodeId.current
        ) {
          const nodeToDelete = nodes.find(
            (n) => n.id === pendingAddStepNodeId.current,
          );
          // Only delete if it's still an addStep node (not configured)
          if (nodeToDelete?.type === "addStep") {
            setNodes((nds) =>
              nds.filter((n) => n.id !== pendingAddStepNodeId.current),
            );
            setEdges((eds) =>
              eds.filter(
                (e) =>
                  e.source !== pendingAddStepNodeId.current &&
                  e.target !== pendingAddStepNodeId.current,
              ),
            );
          }
          pendingAddStepNodeId.current = null;
        }

        // Reset editing state on the node
        if (selectedNodeId) {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === selectedNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    isEditing: false,
                  },
                };
              }
              return node;
            }),
          );
        }
        setSelectedNodeId(null);
        setEditingStepData({});
      }
    },
    [selectedNodeId, nodes, setNodes, setEdges],
  );

  const nodesWithHandlers = nodes.map((node) => {
    const isFirstConfiguredNode =
      node.type === "funnelStep" &&
      nodes.filter((n) => n.type === "funnelStep").indexOf(node) === 0;

    return {
      ...node,
      data: {
        ...node.data,
        onConfigure: handleConfigure,
        isEditing: selectedNodeId === node.id && sheetOpen,
        isFirstNode:
          isFirstConfiguredNode ||
          (node.type === "addStep" && nodes.length === 1),
      },
    };
  });

  const handleNodeClick = useCallback(
    (_: unknown, { id }: { id: string }) => {
      // Open sheet for both funnelStep and addStep nodes
      const node = nodes.find((n) => n.id === id);
      if (node?.type === "funnelStep" || node?.type === "addStep") {
        // Clear pending node tracking since we're editing an existing node
        pendingAddStepNodeId.current = null;
        handleConfigure(id);
      }
    },
    [nodes, handleConfigure],
  );

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, maxZoom: 1.6 });
  }, [fitView]);

  const handleAddStep = useCallback(() => {
    // Check if there's already an addStep node - if so, just open it
    const existingAddStepNode = nodes.find((n) => n.type === "addStep");
    if (existingAddStepNode) {
      handleConfigure(existingAddStepNode.id);
      return;
    }
    // Otherwise create a new one
    createNewStepNode();
  }, [nodes, handleConfigure, createNewStepNode]);

  const isInitNode = nodes.length === 1 && nodes[0]?.type === "addStep";

  return (
    <div
      ref={reactFlowWrapper}
      className={cn(
        "w-full relative border-2 rounded-xl overflow-clip h-full min-h-[720px]",
        isFullScreen && "absolute inset-0",
      )}
    >
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView={isInitNode && true}
        maxZoom={isInitNode ? 1.1 : 1.6}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, strokeDasharray: "5,5" },
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--bklit-300)"
          className="bg-bklit-800"
        />

        {showMiniMap && (
          <MiniMap
            style={{
              backgroundColor: "var(--bklit-600)",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
            }}
            maskColor="color-mix(in srgb, var(--color-bklit-900), transparent 60%)"
            nodeColor="var(--bklit-400)"
            nodeStrokeColor="var(--bklit-400)"
            pannable
            zoomable
            ariaLabel="Mini map"
            inversePan
            zoomStep={0.1}
            offsetScale={0.5}
            position="bottom-left"
          />
        )}

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
            <Button
              variant="secondary"
              onClick={() => setShowMiniMap(!showMiniMap)}
            >
              <SquareChartGantt size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </ButtonGroup>
        </Panel>

        <Panel position="top-left">
          <ButtonGroup orientation="horizontal">
            <Button
              variant="secondary"
              onClick={handleAddStep}
              disabled={nodes.length === 1 && nodes[0]?.type === "addStep"}
            >
              <Plus size={16} />
              Add step
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsEditingFunnel(!isEditingFunnel)}
              disabled={nodes.length === 1 && nodes[0]?.type === "addStep"}
            >
              Edit funnel
            </Button>
            <Button variant="secondary" disabled={nodes.length <= 1}>
              Save
            </Button>
          </ButtonGroup>
        </Panel>
      </ReactFlow>

      <FunnelSettingsSheet
        open={isEditingFunnel}
        onOpenChange={setIsEditingFunnel}
      />

      <StepConfigSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSave={handleSaveStep}
        onDelete={
          selectedNodeId ? () => handleDelete(selectedNodeId) : undefined
        }
        onLiveUpdate={(data) =>
          selectedNodeId && updateNodeDataLive(selectedNodeId, data)
        }
        initialData={
          selectedNodeId
            ? (nodes.find((n) => n.id === selectedNodeId)?.data?.stepData as
                | StepData
                | undefined)
            : undefined
        }
      />
    </div>
  );
}

export function FunnelBuilder() {
  return (
    <ReactFlowProvider>
      <FunnelBuilderInner />
    </ReactFlowProvider>
  );
}
