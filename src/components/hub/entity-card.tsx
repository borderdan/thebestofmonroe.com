'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Activity, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { SourceDrawer } from './source-drawer';

interface EntityCardProps {
  entity: any;
}

export function EntityCard({ entity }: EntityCardProps) {
  const vitalityColor = entity.vitality_score > 50 ? 'text-emerald-500' : 'text-orange-500';
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div className="group relative flex flex-col h-full bg-background border border-border/40 hover:border-border transition-all duration-500 rounded-[2rem] overflow-hidden">
        
        {/* Editorial Image Header */}
        <div className="relative aspect-[16/10] overflow-hidden">
            <img 
                src={entity.commercial_data?.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-6 left-6">
                <Badge className="bg-foreground text-background border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                    {entity.category || 'Monroe Local'}
                </Badge>
            </div>
        </div>

        <div className="p-8 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-serif font-medium tracking-tight leading-[1.1] text-foreground">
                {entity.name}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-medium tracking-tight uppercase">{entity.address}</span>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight className="w-6 h-6 text-accent" />
            </div>
          </div>

          {entity.official_data?.ai_summary && (
            <p className="text-sm leading-relaxed text-muted-foreground font-medium italic mb-8 border-l-2 border-accent/20 pl-4">
                "{entity.official_data.ai_summary}"
            </p>
          )}

          <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Vitality</div>
                    <div className={`text-sm font-black ${vitalityColor} tabular-nums`}>{Math.round(entity.vitality_score || 0)}%</div>
                </div>
                <SourceDrawer 
                    source={entity.source_labels?.[0] || 'Monroe Registry'}
                    confidence={entity.confidence_score || 0.85}
                    lastVerified={entity.last_verified_at || new Date().toISOString()}
                    rawData={{ official: entity.official_data, commercial: entity.commercial_data }}
                />
            </div>
            <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span className="text-xs font-black">{entity.commercial_data?.rating || '---'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
