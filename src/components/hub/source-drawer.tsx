'use client';

import { useState, useEffect } from "react";
import { Info, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface SourceDrawerProps {
  source: string;
  confidence: number;
  lastVerified: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any;
  trigger?: React.ReactNode;
}

export function SourceDrawer({ source, confidence, lastVerified, rawData, trigger }: SourceDrawerProps) {
  const [mounted, setMounted] = useState(false);

  // Safe setMounted via useEffect inside client component
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const confidenceColor = confidence > 0.8 ? 'text-emerald-500' : confidence > 0.5 ? 'text-amber-500' : 'text-red-500';

  const triggerElement = trigger as React.ReactElement || (
    <button className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-accent transition-colors">
      <Info className="w-3 h-3" />
      Source Transparency
    </button>
  );

  if (!mounted) {
    return triggerElement;
  }

  return (
    <Sheet>
      <SheetTrigger 
        render={triggerElement}
      />
      <SheetContent className="bg-zinc-950 border-zinc-900 overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-3xl font-heading font-black tracking-tighter uppercase italic text-zinc-100">Data Provenance</SheetTitle>
          <SheetDescription className="text-zinc-400 font-medium italic">
            &quot;Building civic trust through total transparency.&quot;
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confidence
              </div>
              <div className={`text-2xl font-black ${confidenceColor}`}>{Math.round(confidence * 100)}%</div>
            </div>
            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Verified
              </div>
              <div className="text-base font-black text-zinc-100">{new Date(lastVerified).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-2">Primary Source</h4>
              <div className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex justify-between items-center group">
                  <div className="font-bold text-lg uppercase tracking-tight text-zinc-100">{source}</div>
                  <Button variant="ghost" size="icon" className="group-hover:text-accent group-hover:bg-zinc-800">
                      <ExternalLink className="w-4 h-4" />
                  </Button>
              </div>
          </div>

          {rawData && (
              <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-2">Audit Trace (Raw JSON)</h4>
                  <pre className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-emerald-500 overflow-auto max-h-[300px] scrollbar-hide">
                      {JSON.stringify(rawData, null, 2)}
                  </pre>
              </div>
          )}
        </div>

        <SheetFooter className="pt-2 pb-12">
          <SheetClose 
            render={
              <Button className="w-full rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-black uppercase text-[10px] tracking-widest py-6">
                Acknowledge
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
