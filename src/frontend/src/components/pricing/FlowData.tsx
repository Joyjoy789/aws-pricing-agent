import { type Edge, type Node, Handle, Position } from "@xyflow/react";
import { GoHubot } from "react-icons/go";
import { CiUser } from "react-icons/ci";
import { RiRobot2Line, RiRobot3Line } from "react-icons/ri";
import { BiBot } from "react-icons/bi";
import { TbDatabaseSearch } from "react-icons/tb";
import { PiGlobeSimpleLight } from "react-icons/pi";
import { LuFileCog } from "react-icons/lu";
const common = { draggable: false, selectable: false, focusable: false };

export const PricingNodes: Node[] = [
    {
        id: "initial-user",
        sourcePosition: Position.Bottom,
        type: "iconNode",
        data: {
            icon: <CiUser style={{ fontSize: 25 }} />,
            label: "User",
            handles: {
                top: null,
                bottom: (
                    <Handle id="initial-user-bottom" type="source" position={Position.Bottom} />
                ),
                right: null,
                left: null,
            },
        },
        position: { x: 110, y: 0 },
        style: {
            height: "5vh",
            width: "1vw",
        },
        ...common,
    },
    {
        id: "super-agent",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <GoHubot style={{ fontSize: 25 }} />,
            label: "Supervisor agent\n(Nova Pro)",
            handles: {
                top: (
                    <Handle
                        id={"super-agent-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: (
                    <Handle id={"super-agent-bottom"} type="source" position={Position.Bottom} />
                ),
                right: <Handle id={"super-agent-right"} type="target" position={Position.Right} />,
                left: <Handle id={"super-agent-left"} type="target" position={Position.Left} />,
            },
        },
        position: { x: 60, y: 120 },
        style: {
            height: "8vh",
            width: "8vw",
        },
        ...common,
    },
    {
        id: "demand-analyst",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <RiRobot2Line style={{ fontSize: 25 }} />,
            label: "Demand analyst\n(Claude 3.7 Sonnet)",
            handles: {
                top: (
                    <Handle
                        id={"demand-analyst-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: (
                    <Handle
                        id={"demand-analyst-bottom"}
                        type="source"
                        position={Position.Bottom}
                        style={{
                            marginTop: "5vh",
                        }}
                    />
                ),
                right: null,
                left: <Handle id={"demand-analyst-left"} type="source" position={Position.Left} />,
            },
        },
        position: { x: -100, y: 300 },
        ...common,
    },
    {
        id: "demand-source",
        sourcePosition: Position.Left,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <TbDatabaseSearch style={{ fontSize: 25 }} />,
            label: "Data sources",
            handles: {
                top: (
                    <Handle
                        id={"demand-source-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: null,
                right: null,
                left: null,
            },
        },
        position: { x: -130, y: 450 },
        style: {
            height: "8vh",
            width: "10vw",
        },
        ...common,
    },
    {
        id: "web-scraper-agent",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <BiBot style={{ fontSize: 25 }} />,
            label: "Web scraper\n(Claude Haiku)",
            handles: {
                top: (
                    <Handle
                        id={"web-scraper-agent-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: (
                    <Handle
                        id={"web-scraper-agent-bottom"}
                        type="source"
                        position={Position.Bottom}
                    />
                ),
                right: null,
                left: null,
            },
        },
        position: { x: 10, y: 300 },
        style: {
            height: "8vh",
            width: "15vw",
        },
        ...common,
    },
    {
        id: "web-source",
        sourcePosition: Position.Left,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <PiGlobeSimpleLight style={{ fontSize: 25 }} />,
            label: "Web sites",
            handles: {
                top: (
                    <Handle
                        id={"web-source-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: null,
                right: null,
                left: null,
            },
        },
        position: { x: 60, y: 450 },
        style: {
            height: "8vh",
            width: "10vw",
        },
        ...common,
    },
    {
        id: "margin-agent",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <RiRobot3Line style={{ fontSize: 25 }} />,
            label: "Margin agent\n(Nova Lite)",
            handles: {
                top: (
                    <Handle
                        id={"margin-agent-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: (
                    <Handle id={"margin-agent-bottom"} type="source" position={Position.Bottom} />
                ),
                right: <Handle id={"margin-agent-right"} type="source" position={Position.Right} />,
                left: null,
            },
        },
        position: { x: 220, y: 300 },
        style: {
            height: "8vh",
            width: "8vw",
        },
        ...common,
    },
    {
        id: "margin-config",
        sourcePosition: Position.Right,
        targetPosition: Position.Top,
        type: "iconNode",
        data: {
            icon: <LuFileCog style={{ fontSize: 25 }} />,
            label: "Margin config",
            handles: {
                top: (
                    <Handle
                        id={"margin-config-top"}
                        type="target"
                        position={Position.Top}
                        style={{
                            marginBottom: "5vh",
                        }}
                    />
                ),
                bottom: null,
                right: null,
                left: null,
            },
        },
        position: { x: 155, y: 450 },
        style: {
            height: "10vh",
            width: "15vw",
        },
        ...common,
    },
];

export const PricingEdges: Edge[] = [
    {
        id: "edge-1",
        source: "initial-user",
        target: "super-agent",
        sourceHandle: "initial-user-bottom",
        targetHandle: "super-agent-top",
        animated: true,
        type: "smoothstep",
    },
    {
        id: "edge-2",
        source: "super-agent",
        target: "demand-analyst",
        sourceHandle: "super-agent-bottom",
        targetHandle: "demand-analyst-top",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#4285f4", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-3",
        source: "demand-analyst",
        target: "demand-source",
        sourceHandle: "demand-analyst-bottom",
        targetHandle: "demand-source-top",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#4285f4", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-4",
        source: "demand-analyst",
        target: "super-agent",
        sourceHandle: "demand-analyst-left",
        targetHandle: "super-agent-left",
        animated: true,
        type: "wire",
        data: { label: "Forecast\nData", beginDelay: "0s", fill: "#4285f4", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-5",
        source: "super-agent",
        target: "web-scraper-agent",
        sourceHandle: "super-agent-bottom",
        targetHandle: "web-scraper-agent-top",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#f4ae01", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-6",
        source: "web-scraper-agent",
        target: "web-source",
        sourceHandle: "web-scraper-agent-bottom",
        targetHandle: "web-source-top",
        animated: true,
        type: "wire",
        data: { label: "Site Data", beginDelay: "0s", fill: "#f4ae01", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-7",
        source: "super-agent",
        target: "margin-agent",
        sourceHandle: "super-agent-bottom",
        targetHandle: "margin-agent-top",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#43A047", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-8",
        source: "margin-agent",
        target: "margin-config",
        sourceHandle: "margin-agent-bottom",
        targetHandle: "margin-config-top",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#43A047", x: "-2", y: "-1.75" },
    },
    {
        id: "edge-9",
        source: "margin-agent",
        target: "super-agent",
        sourceHandle: "margin-agent-right",
        targetHandle: "super-agent-right",
        animated: true,
        type: "wire",
        data: { label: "", beginDelay: "0s", fill: "#43A047", x: "-2", y: "-1.75" },
    },
];
