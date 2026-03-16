'use client'

import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import TriggerNode from './nodes/TriggerNode'
import ConditionNode from './nodes/ConditionNode'
import ActionNode from './nodes/ActionNode'
import { useBuilderContext } from './BuilderProvider'

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
}

interface CanvasProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onStateChange?: (nodes: Node[], edges: Edge[]) => void
}

export function Canvas({ initialNodes = [], initialEdges = [], onStateChange }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { setSelectedNodeId } = useBuilderContext()

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          },
          eds
        )
        onStateChange?.(nodes, newEdges)
        return newEdges
      })
    },
    [setEdges, nodes, onStateChange]
  )

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      // Defer state change to next tick to capture the updated nodes
      setTimeout(() => {
        onStateChange?.(nodes, edges)
      }, 0)
    },
    [onNodesChange, nodes, edges, onStateChange]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left - 120,
        y: event.clientY - reactFlowBounds.top - 30,
      }

      const defaultData: Record<string, Record<string, unknown>> = {
        trigger: { label: 'Trigger', triggerType: 'pos_sale_completed' },
        condition: { label: 'Condition', field: '', operator: '==', value: '' },
        action: { label: 'Action', actionType: 'send_webhook', config: {} },
      }

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: defaultData[type] || { label: `${type} node` },
      }

      setNodes((nds) => {
        const updated = nds.concat(newNode)
        onStateChange?.(updated, edges)
        return updated
      })
      setSelectedNodeId(newNode.id)
    },
    [setNodes, edges, onStateChange, setSelectedNodeId]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  return (
    <div className="flex-grow h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!bg-background !border-border/50 !text-foreground [&_button]:!bg-background [&_button]:!border-border/50 [&_button]:!text-foreground [&_button:hover]:!bg-muted" />
        <MiniMap
          className="!bg-muted/50 !border-border/50"
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#f59e0b'
            if (n.type === 'condition') return '#8b5cf6'
            return '#3b82f6'
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
        />
      </ReactFlow>
    </div>
  )
}
