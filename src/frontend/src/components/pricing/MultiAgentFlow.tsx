import {
    type Edge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Node,
    Background,
    ReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import { IconNode } from "./IconNode";
import { Wire } from "./Edge";
import { PricingEdges, PricingNodes } from "./FlowData";
import { useAtomValue } from "jotai";

import { notificationAtom } from "../../atoms/AppAtoms";
import { toast } from "react-toastify";

export const MultiAgentFlow = () => {
    const { fitView } = useReactFlow();
    const defaultViewport = { x: window.innerWidth, y: window.innerHeight, zoom: 0.5 };
    const nodeTypes = useMemo(() => ({ iconNode: IconNode }), []);
    const edgeTypes = {
        wire: Wire,
    };
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const notification = useAtomValue(notificationAtom);

    useEffect(() => {
        if (!notification.isCompleteDemandAnalysis) return;
        toast.success("Demand forecast available. Check Pricing Summary panel");
        setEdges((prev) => [
            ...prev,
            {
                id: "edge-2",
                source: "super-agent",
                target: "demand-analyst",
                sourceHandle: "super-agent-bottom",
                targetHandle: "demand-analyst-top",
                animated: true,
                type: "smoothstep",
            },
            {
                id: "edge-3",
                source: "demand-analyst",
                target: "demand-source",
                sourceHandle: "demand-analyst-bottom",
                targetHandle: "demand-source-top",
                animated: true,
                type: "smoothstep",
            },
            {
                id: "edge-4",
                source: "demand-analyst",
                target: "super-agent",
                sourceHandle: "demand-analyst-left",
                targetHandle: "super-agent-left",
                animated: true,
                type: "smoothstep",
            },
        ]);
    }, [notification.isCompleteDemandAnalysis]);

    useEffect(() => {
        if (!notification.isCompleteWebScarping) return;

        toast.success("Web Scrap data available. Check Pricing Summary panel");
        setEdges((prev) => [
            ...prev,
            {
                id: "edge-5",
                source: "super-agent",
                target: "web-scraper-agent",
                sourceHandle: "super-agent-bottom",
                targetHandle: "web-scraper-agent-top",
                animated: true,
                type: "smoothstep",
            },
            {
                id: "edge-6",
                source: "web-scraper-agent",
                target: "web-source",
                sourceHandle: "web-scraper-agent-bottom",
                targetHandle: "web-source-top",
                animated: true,
                type: "smoothstep",
            },
        ]);
    }, [notification.isCompleteWebScarping]);

    useEffect(() => {
        if (!notification.isCompleteMarginAnalysis) return;

        toast.success("Margin analysis available. Check Pricing Summary panel");

        setEdges((prev) => [
            ...prev,
            {
                id: "edge-7",
                source: "super-agent",
                target: "margin-agent",
                sourceHandle: "super-agent-bottom",
                targetHandle: "margin-agent-top",
                animated: true,
                type: "smoothstep",
            },
            {
                id: "edge-8",
                source: "margin-agent",
                target: "margin-config",
                sourceHandle: "margin-agent-bottom",
                targetHandle: "margin-config-top",
                animated: true,
                type: "smoothstep",
            },
            {
                id: "edge-9",
                source: "margin-agent",
                target: "super-agent",
                sourceHandle: "margin-agent-right",
                targetHandle: "super-agent-right",
                animated: true,
                type: "smoothstep",
            },
        ]);
    }, [notification.isCompleteMarginAnalysis]);

    const handleOnInit = useCallback(() => {
        setNodes(PricingNodes);
        setEdges(PricingEdges);
        setTimeout(() => {
            fitView({
                duration: 1000,
                padding: 0.15,
            });
        }, 1000);
    }, []);

    return (
        <div className="overview" style={{ width: "100%", height: "80vh" }}>
            <ReactFlow
                nodes={nodes}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                edges={edges}
                edgeTypes={edgeTypes}
                defaultViewport={defaultViewport}
                onInit={handleOnInit}
                fitView
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll={false}
                nodesConnectable={false}
            >
                <Background />
                {/* <Controls /> */}
            </ReactFlow>
        </div>
    );
};
