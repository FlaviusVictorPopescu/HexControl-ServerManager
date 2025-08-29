import { useEffect, useState } from "react";
import type { ActivityEvent } from "@shared/api";
import { Api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const unsub = Api.subscribeEvents(
      (e) => setEvents((prev) => [e, ...prev].slice(0, 50)),
      (seed) => setEvents(seed),
    );
    return unsub;
  }, []);

  return (
    <div className="rounded-md border divide-y">
      {events.length === 0 && <div className="p-4 text-sm text-muted-foreground">No recent activity</div>}
      {events.map((e) => (
        <div key={e.id} className="p-3 flex items-center gap-3">
          <Badge variant="secondary">{e.kind}</Badge>
          <div className="flex-1">
            <div className="text-sm">{e.message}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
