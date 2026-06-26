import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const HYATT_ID = "11111111-1111-1111-1111-111111111111";
const HYATT_ROOM_ID = "cccc1ccc-cccc-cccc-cccc-000000000001";
const HYATT_ATTENDANT_ID = "aaaa1aaa-aaaa-aaaa-aaaa-000000000001";
const HYATT_SECOND_ATTENDANT_ID = "aaaa1aaa-aaaa-aaaa-aaaa-000000000002";
const MARRIOTT_ATTENDANT_ID = "aaaa2aaa-aaaa-aaaa-aaaa-000000000001";

function createAnonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email: string) {
  const supabase = createAnonClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: "password123",
  });
  expect(error).toBeNull();
  return supabase;
}

describe.sequential("RLS smoke", () => {
  it("Hyatt manager sees only Hyatt rooms via anon client + login", async () => {
    const supabase = await signIn("manager-a@hyatt.example");

    const { data, error } = await supabase
      .from("room_assignments")
      .select("hotel_id");
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBeGreaterThan(0);
    const hotels = new Set((data ?? []).map((r) => r.hotel_id));
    expect(hotels.size).toBe(1);
    expect(hotels.has(HYATT_ID)).toBe(true);
  });

  it("Hyatt manager can update a Hyatt room assignment", async () => {
    const supabase = await signIn("manager-a@hyatt.example");

    const { data, error } = await supabase
      .from("room_assignments")
      .update({ room_attendant_id: HYATT_ATTENDANT_ID })
      .eq("id", HYATT_ROOM_ID)
      .select("id, room_attendant_id")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.room_attendant_id).toBe(HYATT_ATTENDANT_ID);
  });

  it("Hyatt attendant cannot update a Hyatt room assignment", async () => {
    const supabase = await signIn("attendant-a@hyatt.example");

    const { data, error } = await supabase
      .from("room_assignments")
      .update({ room_attendant_id: HYATT_SECOND_ATTENDANT_ID })
      .eq("id", HYATT_ROOM_ID)
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: room, error: readError } = await supabase
      .from("room_assignments")
      .select("room_attendant_id")
      .eq("id", HYATT_ROOM_ID)
      .single();

    expect(readError).toBeNull();
    expect(room.room_attendant_id).toBe(HYATT_ATTENDANT_ID);
  });

  it("Hyatt manager cannot assign a Marriott attendant to a Hyatt room", async () => {
    const supabase = await signIn("manager-a@hyatt.example");

    const { data, error } = await supabase
      .from("room_assignments")
      .update({ room_attendant_id: MARRIOTT_ATTENDANT_ID })
      .eq("id", HYATT_ROOM_ID)
      .select("id, room_attendant_id");

    expect(data ?? []).toEqual([]);
    expect(error).not.toBeNull();

    const { data: room, error: readError } = await supabase
      .from("room_assignments")
      .select("room_attendant_id")
      .eq("id", HYATT_ROOM_ID)
      .single();

    expect(readError).toBeNull();
    expect(room.room_attendant_id).toBe(HYATT_ATTENDANT_ID);
  });
});
