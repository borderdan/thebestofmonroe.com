'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface BuilderContextType {
  draggedType: string | null
  setDraggedType: (type: string | null) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
}

const BuilderContext = createContext<BuilderContextType>({
  draggedType: null,
  setDraggedType: () => {},
  selectedNodeId: null,
  setSelectedNodeId: () => {},
})

export const useBuilderContext = () => useContext(BuilderContext)

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [draggedType, setDraggedType] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  return (
    <ReactFlowProvider>
      <BuilderContext.Provider
        value={{ draggedType, setDraggedType, selectedNodeId, setSelectedNodeId }}
      >
        <div
          className="flex h-full w-full bg-slate-950"
          onDragOver={(e) => e.preventDefault()}
        >
          {children}
        </div>
      </BuilderContext.Provider>
    </ReactFlowProvider>
  )
}
