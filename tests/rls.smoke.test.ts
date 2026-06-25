import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe("RLS smoke", () => {
  it("Hyatt manager sees only Hyatt rooms via anon client + login", async () => {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: "manager-a@hyatt.example",
      password: "password123",
    });
    expect(signInErr).toBeNull();

    const { data, error } = await supabase
      .from("room_assignments")
      .select("hotel_id");
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBeGreaterThan(0);
    const hotels = new Set((data ?? []).map((r) => r.hotel_id));
    expect(hotels.size).toBe(1);
    expect(hotels.has("11111111-1111-1111-1111-111111111111")).toBe(true);
  });
});
