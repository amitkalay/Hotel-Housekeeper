"use client";

import { useState } from "react";
import { ChevronDownIcon, UserRoundIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomAssignment, Staff } from "@/lib/types/database";

export function RoomCard({
  room,
  attendants,
  canAssign,
  onAssign,
}: {
  room: RoomAssignment;
  attendants: Staff[];
  canAssign: boolean;
  onAssign: (
    room: RoomAssignment,
    roomAttendantId: string | null,
    expectedUpdatedAt: string
  ) => Promise<void>;
}) {
  const [openUpdatedAt, setOpenUpdatedAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const currentAttendant = attendants.find(
    (attendant) => attendant.id === room.room_attendant_id
  );
  const currentAttendantName = room.room_attendant_id
    ? currentAttendant?.full_name ?? "Unknown attendant"
    : "Unassigned";

  function onOpenChange(open: boolean) {
    if (open) setOpenUpdatedAt(room.updated_at);
    else setOpenUpdatedAt(null);
  }

  async function assign(roomAttendantId: string | null) {
    setPending(true);
    await onAssign(room, roomAttendantId, openUpdatedAt ?? room.updated_at);
    setPending(false);
  }

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
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Attendant</p>
            <p className="truncate text-sm">{currentAttendantName}</p>
          </div>
          {canAssign && (
            <DropdownMenu onOpenChange={onOpenChange}>
              <DropdownMenuTrigger
                disabled={pending}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <UserRoundIcon />
                Assign
                <ChevronDownIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Assign attendant</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={pending || room.room_attendant_id === null}
                    onClick={() => void assign(null)}
                  >
                    Unassigned
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {attendants.map((attendant) => (
                    <DropdownMenuItem
                      key={attendant.id}
                      disabled={pending || attendant.id === room.room_attendant_id}
                      onClick={() => void assign(attendant.id)}
                    >
                      {attendant.full_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
