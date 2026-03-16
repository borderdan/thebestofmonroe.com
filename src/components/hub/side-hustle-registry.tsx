'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Hammer, Sparkles, MapPin, Star, ArrowUpRight, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourceDrawer } from './source-drawer';

interface Maker {
  id: string;
  name: string;
  category: string;
  address: string;
  vitality_score: number;
  commercial_data: any;
  official_data: any;
}

export function SideHustleRegistry() {
  const [makers, setMakers] = useState<Maker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchMakers() {
      const { data } = await supabase
        .from('canonical_entities')
        .select('*')
        .eq('type', 'maker')
        .order('vitality_score', { ascending: false });
      
      if (data && data.length > 0) {
        setMakers(data);
      } else {
        // Mock data for initial launch
        setMakers([
          {
            id: 'maker-1',
            name: 'Monroe Custom Woodworks',
            category: 'Handmade Goods',
            address: 'Downtown Monroe',
            vitality_score: 88,
            commercial_data: { rating: 4.9, cover_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800' },
            official_data: { ai_summary: 'Master carpenter specializing in live-edge furniture and custom cabinetry for local homes.' }
          },
          {
            id: 'maker-2',
            name: 'The Pie Lady',
            category: 'Cottage Food',
            address: 'Rolling Hills, Monroe',
            vitality_score: 95,
            commercial_data: { rating: 5.0, cover_url: 'https://images.unsplash.com/photo-1562007908-17c67e870c88?auto=format&fit=crop&q=80&w=800' },
            official_data: { ai_summary: 'Famous for small-batch seasonal pies sold at local Saturday markets and via direct order.' }
          }
        ]);
      }
      setLoading(false);
    }
    fetchMakers();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <h2 className="text-4xl font-heading font-black tracking-tighter uppercase italic text-foreground">
                    Side-Hustle <span className="text-monroe-accent">Registry</span>
                </h2>
                <Badge className="bg-monroe-accent/10 text-monroe-accent border-monroe-accent/20 font-black uppercase tracking-widest text-[10px]">
                    Phase 2 Beta
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium italic max-w-xl">
                "Empowering Monroe's quiet producers. From driveway craftsmans to kitchen entrepreneurs, discover the hidden talent in our community."
            </p>
        </div>
        <Button className="bg-monroe-accent hover:bg-monroe-accent/90 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-full shadow-lg shadow-monroe-accent/20 gap-2">
            <PlusCircle className="w-3.5 h-3.5" />
            Register Your Hustle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {makers.map((maker, idx) => (
          <motion.div 
            key={maker.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex flex-col md:flex-row gap-6 p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 hover:border-monroe-accent/30 transition-all duration-500 overflow-hidden"
          >
            <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0">
                <img 
                    src={maker.commercial_data?.cover_url} 
                    alt={maker.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[10px] font-black uppercase text-white tracking-widest">
                    <Star className="w-3 h-3 text-monroe-accent fill-monroe-accent" />
                    {maker.commercial_data?.rating}
                </div>
            </div>

            <div className="flex-1 flex flex-col py-2">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-monroe-accent flex items-center gap-1.5">
                        <Hammer className="w-3 h-3" />
                        {maker.category}
                    </span>
                    <div className="text-xs font-black italic text-zinc-500">
                        {maker.vitality_score}% Vitality
                    </div>
                </div>

                <h3 className="text-xl font-black tracking-tight text-white uppercase italic mb-2 group-hover:text-monroe-accent transition-colors">
                    {maker.name}
                </h3>

                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mb-4 italic">
                    <MapPin className="w-3 h-3" />
                    {maker.address}
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-6 line-clamp-2">
                    {maker.official_data?.ai_summary}
                </p>

                <div className="mt-auto flex justify-between items-center">
                    <SourceDrawer 
                        source="Community Registry"
                        confidence={0.98}
                        lastVerified={new Date().toISOString()}
                        rawData={maker}
                    />
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-black uppercase tracking-widest text-[9px] text-zinc-400 hover:text-white group-2">
                        View Product Gallery
                        <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                </div>
            </div>
          </motion.div>
        ))}
        
        {/* Placeholder for expansion */}
        <div className="hidden border-2 border-dashed border-zinc-800 rounded-[2rem] p-12 lg:flex flex-col items-center justify-center text-center space-y-4 hover:border-zinc-700 transition-colors cursor-pointer group">
            <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                <Sparkles className="w-8 h-8 text-zinc-500" />
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-black uppercase text-zinc-400">Join the Collective</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Get discovered by neighbors</p>
            </div>
        </div>
      </div>
    </div>
  );
}
