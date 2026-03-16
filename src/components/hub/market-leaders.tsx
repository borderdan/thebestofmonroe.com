import { EntityCard } from '@/components/hub/entity-card'

interface MarketLeadersProps {
  entities: any[]
}

export function MarketLeaders({ entities }: MarketLeadersProps) {
  if (!entities || entities.length === 0) return null

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-end justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight text-foreground">
            Market Leaders
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
            The most active entities in Monroe
          </p>
        </div>
        <button className="text-xs font-bold uppercase tracking-widest text-monroe-accent hover:underline pb-1">
          Full Directory →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </div>
  )
}
