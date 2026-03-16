import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, Cloud, Car, HardHat, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityUpdate {
  id: string;
  type: string;
  title: string;
  description: string;
  event_time: string;
  expires_at?: string;
}

export function CommunityFeed({ updates }: { updates: any[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Car className="w-4 h-4 text-blue-500" />;
      case 'weather': return <Cloud className="w-4 h-4 text-sky-500" />;
      case 'permit': return <HardHat className="w-4 h-4 text-orange-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'traffic': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'weather': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'permit': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'event': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">Community Alerts</CardTitle>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">Live</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-1">
          {updates.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No active alerts for Monroe/Union County.
            </div>
          ) : (
            updates.map((update) => (
              <div 
                key={update.id} 
                className="group flex flex-col gap-1 p-4 hover:bg-muted/50 transition-colors border-b last:border-0 border-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getIcon(update.type)}
                    <span className="font-semibold text-sm line-clamp-1">{update.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">
                    {formatDistanceToNow(new Date(update.event_time))} ago
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-6">
                  {update.description}
                </p>
                <div className="flex items-center gap-2 mt-1 pl-6">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase font-black ${getBadgeColor(update.type)}`}>
                    {update.type}
                  </Badge>
                  {update.expires_at && (
                    <span className="text-[9px] text-muted-foreground italic">
                      Expires {formatDistanceToNow(new Date(update.expires_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
