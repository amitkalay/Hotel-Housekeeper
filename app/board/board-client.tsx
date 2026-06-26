"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { RoomAssignment, Staff, UserHotelMembership } from "@/lib/types/database";
import { subscribeToRoomAssignmentUpdates } from "@/lib/rooms/realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RoomCard } from "@/components/room-card";

type AssignmentResponse = {
  error?: string;
  room?: RoomAssignment;
};

export function BoardClient({
  initialRooms,
  attendants,
  memberships,
}: {
  initialRooms: RoomAssignment[];
  attendants: Staff[];
  memberships: UserHotelMembership[];
}) {
  const [rooms, setRooms] = useState<RoomAssignment[]>(initialRooms);
  const managerHotelIds = useMemo(
    () =>
      new Set(
        memberships
          .filter((membership) => membership.role === "manager")
          .map((membership) => membership.hotel_id)
      ),
    [memberships]
  );

  const replaceRoom = useCallback((updatedRoom: RoomAssignment) => {
    setRooms((currentRooms) =>
      currentRooms.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
    );
  }, []);

  async function assignRoom(
    room: RoomAssignment,
    roomAttendantId: string | null,
    expectedUpdatedAt: string
  ) {
    const nextAttendant = attendants.find((attendant) => attendant.id === roomAttendantId);
    const nextLabel = nextAttendant?.full_name ?? "Unassigned";

    try {
      const response = await fetch(`/api/rooms/${room.id}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomAttendantId, expectedUpdatedAt }),
      });
      const body = (await response.json().catch(() => ({}))) as AssignmentResponse;

      if (response.ok && body.room) {
        replaceRoom(body.room);
        toast.success(`Room ${room.room_number} assigned to ${nextLabel}.`);
        return;
      }

      if (response.status === 409 && body.room) {
        replaceRoom(body.room);
        toast.error("This room changed while the menu was open. Review the latest assignment and try again.");
        return;
      }

      toast.error(body.error ?? "Failed to update room assignment.");
    } catch {
      toast.error("Failed to update room assignment.");
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/rooms")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setRooms(d.rooms ?? []))
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    return subscribeToRoomAssignmentUpdates(supabase, replaceRoom);
  }, [replaceRoom]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          attendants={attendants.filter((attendant) => attendant.hotel_id === room.hotel_id)}
          canAssign={managerHotelIds.has(room.hotel_id)}
          onAssign={assignRoom}
        />
      ))}
    </div>
  );
}
