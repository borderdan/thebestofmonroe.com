'use client';

import { motion } from "framer-motion";
import { Star, MapPin, Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DailySpotlightProps {
  entity: any;
}

export function DailySpotlight({ entity }: DailySpotlightProps) {
  if (!entity) return null;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-xl group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative h-[300px] lg:h-auto overflow-hidden">
              <img 
                src={entity.commercial_data?.cover_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"} 
                alt={entity.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1 text-xs font-black uppercase tracking-widest">
                  Daily Spotlight
                </Badge>
                <Badge className="bg-success text-success-foreground shadow-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Local
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(entity.commercial_data?.rating || 5) ? 'fill-current' : 'opacity-30'}`} />
                ))}
                <span className="text-sm font-bold ml-1">{entity.commercial_data?.rating || '5.0'}</span>
              </div>

              <h2 className="text-3xl lg:text-5xl font-display font-black tracking-tighter text-foreground mb-4 leading-none">
                {entity.name}
              </h2>

              <p className="text-lg text-muted-foreground font-body mb-8 leading-relaxed line-clamp-3">
                {entity.official_data?.ai_summary || "This local Monroe business is a staple of our community, offering exceptional service and local value. Discover why they're our featured spotlight today."}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/5 text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Location</div>
                    <div className="text-sm font-bold truncate max-w-[150px]">{entity.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vitality</div>
                    <div className="text-sm font-bold">{Math.round(entity.vitality_score || 0)}% Active</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-2xl px-8 py-6 h-auto text-base font-black shadow-lg shadow-primary/20">
                  Visit Profile <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-2xl px-8 py-6 h-auto text-base font-bold border-border/50">
                  Share Local
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
