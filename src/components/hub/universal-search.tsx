'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Building2, FileText, Calendar, ArrowRight, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ entities: any[], feed: any[] }>({ entities: [], feed: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ entities: [], feed: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const searchTerm = `%${query}%`;

      const [entitiesRes, feedRes] = await Promise.all([
        supabase
          .from('canonical_entities')
          .select('id, name, type, category, address, vitality_score')
          .or(`name.ilike.${searchTerm},category.ilike.${searchTerm},address.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from('community_feed')
          .select('id, title, type, description, event_time, severity')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .order('event_time', { ascending: false })
          .limit(5)
      ]);

      setResults({
        entities: entitiesRes.data || [],
        feed: feedRes.data || []
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-border/40 rounded-full text-muted-foreground hover:text-foreground transition-all group w-full md:w-64"
      >
        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">Search Monroe...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0 border-zinc-800 bg-zinc-950 overflow-hidden rounded-3xl">
          <DialogHeader className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-monroe-accent" />
              <Input 
                placeholder="Search businesses, permits, events..."
                className="border-none bg-transparent text-lg focus-visible:ring-0 p-0 placeholder:text-zinc-600 font-bold tracking-tight text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />}
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-8 scrollbar-hide">
            {query.length < 2 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                        <Search className="w-8 h-8 text-zinc-700" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase text-zinc-400">Search Anything</h3>
                        <p className="text-xs text-zinc-600 font-medium italic">Try "Milk", "Permit", or "Brewery"</p>
                    </div>
                </div>
            )}

            {results.entities.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2 flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Market Leaders & Entities
                </h3>
                <div className="grid gap-2">
                  {results.entities.map(e => (
                    <button key={e.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-monroe-accent/50 transition-all group">
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-zinc-100 uppercase tracking-tight italic">{e.name}</span>
                             <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase tracking-widest bg-zinc-800/5 border-zinc-800">{e.type}</Badge>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold truncate max-w-[300px] italic">{e.address}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-monroe-accent transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.feed.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Civic Signal Feed
                </h3>
                <div className="grid gap-2">
                  {results.feed.map(f => (
                    <button key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group text-left">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{f.title}</span>
                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase tracking-widest bg-emerald-500/5 border-emerald-500/20 text-emerald-500">{f.type}</Badge>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold truncate max-w-[400px] italic">{f.description}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {query.length >= 2 && results.entities.length === 0 && results.feed.length === 0 && !loading && (
                 <div className="py-12 text-center text-zinc-500 text-xs font-bold uppercase italic tracking-widest">
                 No signals found for "{query}"
               </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center px-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-600">
                    <span className="p-1 rounded bg-zinc-800 text-zinc-400">ESC</span>
                    Close
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-600">
                    <span className="p-1 rounded bg-zinc-800 text-zinc-400">⏎</span>
                    Select
                </div>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-monroe-accent/60">
                  Made in Monroe Intelligence
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
