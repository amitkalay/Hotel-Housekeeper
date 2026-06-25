"use client";

import { useEffect, useState } from "react";
import type { RoomAssignment } from "@/lib/types/database";
import { RoomCard } from "@/components/room-card";

export function BoardClient({ initialRooms }: { initialRooms: RoomAssignment[] }) {
  const [rooms, setRooms] = useState<RoomAssignment[]>(initialRooms);

  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/rooms")
        .then((r) => r.json())
        .then((d) => setRooms(d.rooms ?? []))
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
