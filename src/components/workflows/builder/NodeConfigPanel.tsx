'use client'

import { useReactFlow } from '@xyflow/react'
import { useBuilderContext } from './BuilderProvider'
import { TRIGGER_EVENTS } from './nodes/TriggerNode'
import { OPERATORS } from './nodes/ConditionNode'
import { ACTION_TYPES } from './nodes/ActionNode'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Settings2 } from 'lucide-react'

export function NodeConfigPanel() {
  const { selectedNodeId, setSelectedNodeId } = useBuilderContext()
  const { getNode, setNodes, setEdges } = useReactFlow()

  if (!selectedNodeId) {
    return (
      <div className="w-72 border-l border-border/50 bg-background/90 backdrop-blur-lg p-6 flex flex-col items-center justify-center text-center gap-3">
        <Settings2 className="w-10 h-10 text-muted-foreground" />
        <p className="text-xs text-muted-foreground/70 font-medium">
          Click a node on the canvas to configure it
        </p>
      </div>
    )
  }

  const node = getNode(selectedNodeId)
  if (!node) return null

  const updateNodeData = (updates: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, ...updates } }
          : n
      )
    )
  }

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
  }

  return (
    <div className="w-72 border-l border-border/50 bg-background/90 backdrop-blur-lg overflow-y-auto">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {node.type === 'trigger' && 'Trigger Config'}
          {node.type === 'condition' && 'Condition Config'}
          {node.type === 'action' && 'Action Config'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10"
          onClick={deleteNode}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* TRIGGER NODE CONFIG */}
        {node.type === 'trigger' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Event Trigger</Label>
              <ShadSelect
                value={(node.data?.triggerType as string) || ''}
                onValueChange={(v) => updateNodeData({ triggerType: v })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50 text-foreground text-sm">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 text-popover-foreground">
                  {TRIGGER_EVENTS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>
          </div>
        )}

        {/* CONDITION NODE CONFIG */}
        {node.type === 'condition' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Field Name</Label>
              <Input
                value={(node.data?.field as string) || ''}
                onChange={(e) => updateNodeData({ field: e.target.value })}
                placeholder="e.g. total, metadata.source"
                className="bg-muted/50 border-border/50 text-foreground text-sm"
              />
              <p className="text-[10px] text-muted-foreground/70">
                Use dot notation for nested fields (e.g. metadata.source)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Operator</Label>
              <ShadSelect
                value={(node.data?.operator as string) || '=='}
                onValueChange={(v) => updateNodeData({ operator: v })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50 text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 text-popover-foreground">
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                value={String(node.data?.value ?? '')}
                onChange={(e) => updateNodeData({ value: e.target.value })}
                placeholder="Comparison value"
                className="bg-muted/50 border-border/50 text-foreground text-sm"
              />
            </div>
          </div>
        )}

        {/* ACTION NODE CONFIG */}
        {node.type === 'action' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Action Type</Label>
              <ShadSelect
                value={(node.data?.actionType as string) || 'send_webhook'}
                onValueChange={(v) => updateNodeData({ actionType: v, config: {} })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50 text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 text-popover-foreground">
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            {/* Per-action-type config fields */}
            {(node.data?.actionType as string) === 'send_webhook' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                <Input
                  value={(node.data?.config as Record<string, string>)?.url || ''}
                  onChange={(e) =>
                    updateNodeData({
                      config: { ...(node.data?.config as Record<string, unknown>), url: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="bg-muted/50 border-border/50 text-foreground text-sm"
                />
              </div>
            )}

            {(node.data?.actionType as string) === 'send_email' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recipient Email</Label>
                  <Input
                    value={(node.data?.config as Record<string, string>)?.to || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), to: e.target.value },
                      })
                    }
                    placeholder="user@example.com (or leave blank for record.email)"
                    className="bg-muted/50 border-border/50 text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input
                    value={(node.data?.config as Record<string, string>)?.subject || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), subject: e.target.value },
                      })
                    }
                    placeholder="Email subject"
                    className="bg-muted/50 border-border/50 text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Body</Label>
                  <Textarea
                    value={(node.data?.config as Record<string, string>)?.body || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), body: e.target.value },
                      })
                    }
                    placeholder="Email body text"
                    className="bg-muted/50 border-border/50 text-foreground text-sm min-h-[80px]"
                  />
                </div>
              </>
            )}

            {(node.data?.actionType as string) === 'send_whatsapp' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Phone Number</Label>
                  <Input
                    value={(node.data?.config as Record<string, string>)?.phone || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), phone: e.target.value },
                      })
                    }
                    placeholder="+52 55 1234 5678"
                    className="bg-muted/50 border-border/50 text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Message Template</Label>
                  <Textarea
                    value={(node.data?.config as Record<string, string>)?.message || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), message: e.target.value },
                      })
                    }
                    placeholder="Hello! A new sale of {{total}} was made."
                    className="bg-muted/50 border-border/50 text-foreground text-sm min-h-[80px]"
                  />
                </div>
              </>
            )}

            {(node.data?.actionType as string) === 'update_record' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Table Name</Label>
                  <Input
                    value={(node.data?.config as Record<string, string>)?.table || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), table: e.target.value },
                      })
                    }
                    placeholder="entities"
                    className="bg-muted/50 border-border/50 text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Update JSON</Label>
                  <Textarea
                    value={(node.data?.config as Record<string, string>)?.updateJson || ''}
                    onChange={(e) =>
                      updateNodeData({
                        config: { ...(node.data?.config as Record<string, unknown>), updateJson: e.target.value },
                      })
                    }
                    placeholder='{"is_active": false}'
                    className="bg-muted/50 border-border/50 text-foreground text-sm font-mono min-h-[60px]"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
