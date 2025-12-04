"use client";

import { useCallback, useRef, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MarkerType,
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

import { Button } from "@bklit/ui/components/button";
import { Funnel } from "lucide-react";
import { AddStepNode } from "./add-step-node";
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
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleConfigure = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [setNodes, setEdges],
  );

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

  const addFirstStep = useCallback(() => {
    const newNodeId = `step-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: "addStep",
      position: { x: 250, y: 200 },
      data: {
        label: "Add Step",
        onConfigure: handleConfigure,
        onDelete: handleDelete,
        isConfigured: false,
        isFirstNode: true,
      },
    };
    setNodes([newNode]);
    setSelectedNodeId(newNodeId);
    setSheetOpen(true);
    setEditingStepData({});
  }, [setNodes, handleConfigure, handleDelete]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, strokeDasharray: "5,5" },
            animated: true,
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const onConnectStart = useCallback(
    (_: unknown, { nodeId }: { nodeId: string | null }) => {
      connectingNodeId.current = nodeId;
    },
    [],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;

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

        const newNodeId = `step-${Date.now()}`;
        const newNode: Node = {
          id: newNodeId,
          type: "addStep",
          position: {
            x: position.x - 100,
            y: position.y - 40,
          },
          data: {
            label: "Add Step",
            onConfigure: handleConfigure,
            onDelete: handleDelete,
            isConfigured: false,
            isFirstNode: false,
          },
        };

        setNodes((nds) => nds.concat(newNode));
        const sourceNodeId = connectingNodeId.current;
        if (sourceNodeId) {
          setEdges((eds) =>
            eds.concat({
              id: `e-${sourceNodeId}-${newNodeId}`,
              source: sourceNodeId,
              target: newNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, strokeDasharray: "5,5" },
              animated: true,
            }),
          );
        }

        setTimeout(() => {
          setSelectedNodeId(newNodeId);
          setSheetOpen(true);
          setEditingStepData({});
        }, 100);
      }

      connectingNodeId.current = null;
    },
    [setNodes, setEdges, handleConfigure, handleDelete, screenToFlowPosition],
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
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2, strokeDasharray: "5,5" },
                animated: true,
              });
            }

            return eds;
          });
        }
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
    [selectedNodeId, setNodes],
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
        onDelete: handleDelete,
        isEditing: selectedNodeId === node.id && sheetOpen,
        isFirstNode:
          isFirstConfiguredNode ||
          (node.type === "addStep" && nodes.length === 1),
      },
    };
  });

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full relative border-2 rounded-xl overflow-clip h-full min-h-[720px]"
    >
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, strokeDasharray: "5,5" },
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--bklit-300)"
          className="bg-bklit-700"
        />
        <Controls className="bg-bklit-800 [&>button]:bg-bklit-700! [&>button]:border-border! [&>button>svg]:fill-current! [&>button>svg]:text-bklit-300!" />
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="flex flex-col items-center gap-4 p-8 bg-card border border-border rounded-xl shadow-lg">
              <div className="w-16 h-16 rounded-full bg-bklit-600 flex items-center justify-center">
                <Funnel size={24} />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Start Your Funnel
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first step to begin building your conversion funnel
                </p>
              </div>
              <Button size="lg" onClick={addFirstStep}>
                Add First Step
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <StepConfigSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSave={handleSaveStep}
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
