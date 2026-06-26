import { describe, expect, it, vi } from "vitest";
import {
  subscribeToRoomAssignmentUpdates,
  type RoomRealtimeClient,
} from "@/lib/rooms/realtime";
import type { RoomAssignment } from "@/lib/types/database";

const updatedRoom: RoomAssignment = {
  id: "cccc1ccc-cccc-cccc-cccc-000000000002",
  hotel_id: "11111111-1111-1111-1111-111111111111",
  room_number: "102",
  room_type: "SUITE",
  status: "VC",
  room_attendant_id: "aaaa1aaa-aaaa-aaaa-aaaa-000000000001",
  assignment_date: "2026-06-26",
  is_vip: false,
  is_dnd: false,
  has_pets: false,
  remarks: null,
  updated_at: "2026-06-26T12:00:00.000Z",
};

function createRealtimeMock() {
  let capturedCallback: ((payload: { new: RoomAssignment }) => void) | undefined;
  const channel = {
    on: vi.fn(
      (
        _eventType: string,
        _filter: Record<string, string>,
        callback: (payload: { new: RoomAssignment }) => void
      ) => {
        capturedCallback = callback;
        return channel;
      }
    ),
    subscribe: vi.fn(() => channel),
  };
  const supabase = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };

  return {
    channel,
    getCapturedCallback: () => capturedCallback,
    supabase: supabase as unknown as RoomRealtimeClient,
  };
}

describe("subscribeToRoomAssignmentUpdates", () => {
  it("subscribes to public room assignment update events", () => {
    const { channel, supabase } = createRealtimeMock();

    subscribeToRoomAssignmentUpdates(supabase, vi.fn());

    expect(supabase.channel).toHaveBeenCalledWith("room-assignments-updates");
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "room_assignments" },
      expect.any(Function)
    );
    expect(channel.subscribe).toHaveBeenCalledOnce();
  });

  it("passes updated room rows to the replacement callback", () => {
    const onRoomUpdate = vi.fn();
    const { getCapturedCallback, supabase } = createRealtimeMock();

    subscribeToRoomAssignmentUpdates(supabase, onRoomUpdate);
    getCapturedCallback()?.({ new: updatedRoom });

    expect(onRoomUpdate).toHaveBeenCalledWith(updatedRoom);
  });

  it("removes the realtime channel during cleanup", () => {
    const { channel, supabase } = createRealtimeMock();

    const cleanup = subscribeToRoomAssignmentUpdates(supabase, vi.fn());
    cleanup();

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
