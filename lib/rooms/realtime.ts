import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoomAssignment } from "@/lib/types/database";

export type RoomRealtimeClient = Pick<SupabaseClient, "channel" | "removeChannel">;

export function subscribeToRoomAssignmentUpdates(
  supabase: RoomRealtimeClient,
  onRoomUpdate: (room: RoomAssignment) => void
) {
  const channel = supabase
    .channel("room-assignments-updates")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "room_assignments" },
      (payload) => {
        onRoomUpdate(payload.new as RoomAssignment);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
