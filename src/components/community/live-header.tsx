'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Car, Cloud, Info, ShoppingCart, Tag, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveHeader() {
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    
    async function fetchAll() {
      const [feedRes, groceryRes] = await Promise.all([
        supabase
          .from('community_feed')
          .select('*')
          .or('severity.eq.critical,severity.eq.high,type.eq.weather,type.eq.traffic,type.eq.aviation')
          .order('event_time', { ascending: false })
          .limit(10),
        supabase
          .from('grocery_prices' as any)
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(5)
      ]);
      
      const combined = [
        ...(feedRes.data || []),
        ...(groceryRes.data || []).map(g => ({
          ...g,
          type: 'grocery',
          title: `Wallet: ${g.item_name} @ ${g.store_name}`,
          description: `Best Price: $${g.price} (${g.unit})`
        }))
      ];
      
      if (combined.length > 0) setItems(combined);
    }

    fetchAll();
    const interval = setInterval(fetchAll, 60000); // 60s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [items]);

  if (items.length === 0) return null;

  const current = items[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Car className="w-3.5 h-3.5" />;
      case 'weather': return <Cloud className="w-3.5 h-3.5" />;
      case 'aviation': return <Plane className="w-3.5 h-3.5" />;
      case 'alert': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'grocery': return <Tag className="w-3.5 h-3.5" />;
      default: return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getBgColor = (severity: string, type: string) => {
    if (type === 'grocery') return 'bg-emerald-600 text-white';
    if (type === 'aviation') return 'bg-sky-600 text-white';
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-600 text-white';
      default: return 'bg-zinc-900 text-zinc-100 border-zinc-800';
    }
  };

  return (
    <div className={`h-9 w-full border-b flex items-center px-6 overflow-hidden transition-all duration-700 ${getBgColor(current.severity, current.type)} shadow-inner`}>
      <div className="flex items-center gap-3 font-black uppercase tracking-tighter text-[11px] whitespace-nowrap mr-6 border-r border-current/20 pr-6">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        MADE IN MONROE <span className="opacity-60">LIVE</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.id}-${currentIndex}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="flex items-center gap-3 text-xs font-bold truncate tracking-tight"
        >
          <div className="p-1 rounded-md bg-white/10">{getIcon(current.type)}</div>
          <span className="uppercase text-[10px] opacity-70 tracking-widest">{current.title}</span>
          <span className="truncate font-medium">{current.description}</span>
        </motion.div>
      </AnimatePresence>

      <div className="ml-auto flex items-center gap-1.5 pl-6 border-l border-current/20">
          {items.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-current w-4' : 'bg-current/20'}`}
              />
          ))}
      </div>
    </div>
  );
}
