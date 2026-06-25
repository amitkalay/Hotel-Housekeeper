import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { RoomAssignment } from "@/lib/types/database";

export function RoomCard({ room }: { room: RoomAssignment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Room {room.room_number}</CardTitle>
        <CardDescription>{room.room_type}</CardDescription>
        <CardAction>
          <StatusBadge status={room.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 text-xs">
          {room.is_vip && <span className="rounded bg-amber-100 px-1.5 text-amber-900">VIP</span>}
          {room.is_dnd && <span className="rounded bg-rose-100 px-1.5 text-rose-900">DND</span>}
          {room.has_pets && <span className="rounded bg-emerald-100 px-1.5 text-emerald-900">Pets</span>}
        </div>
        {room.remarks && (
          <p className="mt-2 text-xs italic text-muted-foreground">{room.remarks}</p>
        )}
      </CardContent>
    </Card>
  );
}
