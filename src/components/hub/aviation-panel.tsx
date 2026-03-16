'use client';

import { Plane, PlaneLanding, PlaneTakeoff, Info, Radar } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { motion } from "framer-motion";

interface AviationPanelProps {
  flights: any[];
}

export function AviationPanel({ flights }: AviationPanelProps) {
  return (
    <div className="w-full">
        <div className="divide-y divide-border/50 mt-2">
            {flights.length === 0 ? (
                <div className="py-6 text-center">
                    <Plane className="w-6 h-6 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Clear Skies</p>
                </div>
            ) : flights.slice(0, 5).map((flight, idx) => (
                <div 
                    key={flight.id}
                    className="py-3 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors -mx-4 px-4 cursor-default"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${flight.source_id.includes('arr') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {flight.source_id.includes('arr') ? <PlaneLanding className="w-4 h-4" /> : <PlaneTakeoff className="w-4 h-4" />}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-foreground leading-none mb-1 group-hover:text-monroe-accent transition-colors">
                                {flight.title.split(': ')[1] || flight.title}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {flight.description.split('|')[0].replace('From: ', '').replace('To: ', '')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-foreground tabular-nums">
                            {flight.raw_data?.estimated_on ? new Date(flight.raw_data.estimated_on).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                        </div>
                        <div className="text-[9px] font-medium text-muted-foreground uppercase mt-0.5">
                            {formatDistanceToNow(new Date(flight.event_time), { addSuffix: true })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="pt-3 pb-1 text-center border-t border-border/50">
            <button className="text-[10px] font-bold uppercase tracking-widest text-monroe-accent hover:underline flex items-center gap-1.5 mx-auto">
                <Radar className="w-3 h-3" /> Full Arrivals Board
            </button>
        </div>
    </div>
  );
}
