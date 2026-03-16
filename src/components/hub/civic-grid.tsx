'use client';

import { Newspaper, CalendarDays, ArrowRight, HardHat, Briefcase, Activity, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { SourceDrawer } from "./source-drawer";

interface CivicGridProps {
  updates: any[];
}

export function CivicGrid({ updates }: CivicGridProps) {
  const news = updates.filter(u => ['alert', 'traffic', 'weather'].includes(u.type)).slice(0, 3);
  const events = updates.filter(u => u.type === 'event').slice(0, 4);
  const development = updates.filter(u => u.type === 'permit').slice(0, 3);

  return (
    <section className="space-y-24 py-12">
        
        {/* 1. The Pulse (News & Alerts) */}
        <div className="space-y-12">
            <div className="flex items-end justify-between border-b border-foreground/10 pb-6">
                <div>
                    <h2 className="text-4xl lg:text-6xl font-heading font-black tracking-tight uppercase leading-none">The Pulse</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4">Made in Monroe Civic Ticker</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest pb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Civic Data Active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {news.map((item, idx) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group space-y-4"
                    >
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>{item.type}</span>
                            <span>{format(new Date(item.event_time), "MMM d, h:mm a")}</span>
                        </div>
                        <h3 className="text-xl font-bold leading-tight group-hover:text-accent transition-colors duration-300">
                            {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                            {item.description}
                        </p>
                        <div className="pt-2">
                            <SourceDrawer 
                                source={item.type === 'weather' ? 'NWS Weather Gov' : item.type === 'traffic' ? 'NCDOT DriveNC' : 'MadeInMonroe Official'}
                                confidence={0.95}
                                lastVerified={item.updated_at || item.created_at}
                                rawData={item.raw_data}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* 2. Unified Calendar & Development */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            
            {/* Events Editorial */}
            <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Made in Monroe Calendar</h3>
                    <Button variant="link" className="text-[10px] font-black uppercase tracking-widest p-0 h-auto">View All</Button>
                </div>
                <div className="divide-y divide-foreground/5">
                    {events.map((event) => (
                        <div key={event.id} className="py-6 flex gap-8 items-start group cursor-pointer">
                            <div className="text-center min-w-[60px]">
                                <div className="text-[10px] font-black uppercase text-muted-foreground">{format(new Date(event.event_time), "MMM")}</div>
                                <div className="text-3xl font-black tabular-nums">{format(new Date(event.event_time), "dd")}</div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">{event.title}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format(new Date(event.event_time), "h:mm a")}</span>
                                    <span className="text-foreground/10">|</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{event.location_name || "Monroe Executive"}</span>
                                </div>
                                <div className="mt-4">
                                    <SourceDrawer 
                                        source="City of Monroe Alerts"
                                        confidence={0.9}
                                        lastVerified={event.updated_at || event.created_at}
                                        rawData={event.raw_data}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Development Editorial */}
            <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter">Development Watch</h3>
                    <div className="p-1 px-2 rounded-lg bg-orange-500/10 text-orange-600 text-[9px] font-black uppercase tracking-widest">Active Permits</div>
                </div>
                <div className="space-y-8">
                    {development.map((item) => (
                        <div key={item.id} className="p-8 rounded-[2rem] bg-foreground/5 hover:bg-foreground/10 transition-all duration-500 group">
                            <div className="flex items-center gap-3 mb-4">
                                <HardHat className="w-4 h-4 text-orange-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">New Construction</span>
                            </div>
                            <h4 className="text-lg font-black leading-tight mb-3">{item.title}</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed italic line-clamp-2">
                                {item.description}
                            </p>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{format(new Date(item.event_time), "MMMM yyyy")}</span>
                                    <SourceDrawer 
                                        source="Union County Permit Center"
                                        confidence={0.98}
                                        lastVerified={item.updated_at || item.created_at}
                                        rawData={item.raw_data}
                                    />
                                </div>
                                <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-background shadow-sm">Details</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
  );
}
