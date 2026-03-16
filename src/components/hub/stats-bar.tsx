'use client';

import { motion } from "framer-motion";
import { TrendingUp, Users, Map, Heart, Activity } from "lucide-react";

interface StatsBarProps {
  stats: {
    businesses: number;
    members: number;
    permits: number;
    pulse: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Market", value: stats.businesses.toLocaleString(), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Community", value: stats.members.toLocaleString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Growth", value: stats.permits.toLocaleString(), icon: Map, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Pulse", value: `${stats.pulse}%`, icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <section className="bg-card/30 backdrop-blur-md rounded-[2.5rem] border border-border/40 p-8 shadow-sm group">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Activity className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Economic Vitals</span>
      </div>
      
      <div className="grid grid-cols-2 gap-y-10 gap-x-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center space-y-3 group/item"
          >
            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover/item:scale-110 transition-transform duration-500 shadow-sm border border-white/5`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
                <div className="text-2xl font-black font-display tracking-tight text-foreground">{item.value}</div>
                <div className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest leading-none">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border/20 text-center">
        <button className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2 mx-auto">
            Explore Full Census Data
        </button>
      </div>
    </section>
  );
}
