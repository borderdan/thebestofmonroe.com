'use client';

import { motion } from "framer-motion";
import { Tag, ArrowRight, ShoppingCart, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DealsCarouselProps {
  deals: any[];
}

export function DealsCarousel({ deals }: DealsCarouselProps) {
  if (deals.length === 0) return null;

  return (
    <section className="py-14 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary font-bold uppercase text-[10px] tracking-[0.2em]">
              <Percent className="w-3.5 h-3.5" />
              Direct Savings
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight">The Wallet</h2>
          </div>
          <Button variant="ghost" className="text-primary font-black uppercase text-[10px] tracking-widest hidden sm:flex">
            See All Deals <ArrowRight className="ml-2 w-3 h-3" />
          </Button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x px-2">
          {deals.map((deal, idx) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="min-w-[280px] md:min-w-[320px] snap-start"
            >
              <div className="bg-card rounded-[2rem] border border-border/50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Tag className="w-20 h-20 rotate-12" />
                </div>
                
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      {deal.store_name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Verified 2h ago</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-display line-clamp-1">{deal.item_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                        {deal.store_location || 'Local Store'}
                    </p>
                  </div>

                  <div className="flex items-end gap-2 py-2">
                    <span className="text-4xl font-black tracking-tighter text-emerald-600">${deal.price}</span>
                    <span className="text-xs text-muted-foreground font-bold mb-1 uppercase">{deal.unit}</span>
                  </div>

                  <Button className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest py-6 h-auto">
                    Check Availability <ShoppingCart className="ml-2 w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
