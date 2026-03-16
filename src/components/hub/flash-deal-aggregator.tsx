'use client';

import { Tag, Clock, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FlashDeal {
  id: string;
  title: string;
  description: string;
  expires_at?: string;
  merchant?: string;
}

export function FlashDealAggregator({ updates }: { updates: any[] }) {
  // Filter for deals - in a real app, we'd have a specific 'deal' type
  // but for MVP we search for keywords in events and job/maker descriptions.
  const keywords = ['deal', 'discount', 'happy hour', 'off', '%', 'sale', 'save'];
  
  const deals = updates.filter(u => {
    const text = (u.title + ' ' + (u.description || '')).toLowerCase();
    return keywords.some(k => text.includes(k));
  });

  // Mock deals if none found for demo
  const displayDeals = deals.length > 0 ? deals : [
    {
      id: 'mock-deal-1',
      title: 'Monroe Crossings BOGO',
      description: 'Buy one get one free on all accessories this weekend only.',
      merchant: 'Monroe Crossings Mall',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
        id: 'mock-deal-2',
        title: 'Happy Hour at The Courthouse',
        description: '$2 off all self-pour taps from 4pm-6pm every weekday.',
        merchant: 'The Courthouse Self-Pour',
        expires_at: new Date(Date.now() + 3600000).toISOString()
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-3">
                Flash Deals <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic">Live from the Monroe Marketplace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayDeals.map((deal: any, idx) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                <Tag className="w-12 h-12 text-yellow-500" />
            </div>

            <div className="relative flex flex-col h-full gap-4">
               <div className="flex justify-between items-start">
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[8px] font-black uppercase tracking-widest px-2 h-5">
                       Active Now
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        Today
                    </div>
               </div>

               <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter italic">
                        {deal.merchant || 'Monroe Merchant'}
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white leading-tight uppercase italic">{deal.title}</h3>
               </div>

               <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-4 line-clamp-2 italic">
                   "{deal.description}"
               </p>

               <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-between h-9 px-4 rounded-xl bg-zinc-800/50 hover:bg-yellow-500 hover:text-black font-black uppercase tracking-widest text-[9px] transition-all">
                        Claim Deal
                        <ArrowRight className="w-3 h-3" />
                    </Button>
               </div>
            </div>
          </motion.div>
        ))}

        <div className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 transition-colors text-center gap-4 cursor-pointer group">
            <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                <Sparkles className="w-6 h-6 text-zinc-600" />
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">More Deals</h4>
                <p className="text-xs text-zinc-600 font-bold italic">Unlock local secrets</p>
            </div>
        </div>
      </div>
    </div>
  );
}
