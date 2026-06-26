import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createServiceClient: vi.fn(() => {
    throw new Error("service client must not be used by /api/rooms/all");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}));

import { GET } from "@/app/api/rooms/all/route";

function createSupabaseMock({
  user,
  rooms = [],
  queryError = null,
}: {
  user: { id: string } | null;
  rooms?: unknown[];
  queryError?: { message: string } | null;
}) {
  const query = {
    eq: vi.fn().mockResolvedValue({ data: rooms, error: queryError }),
  };
  const table = {
    select: vi.fn(() => query),
  };
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => table),
  };

  return { supabase, table, query };
}

describe("/api/rooms/all", () => {
  beforeEach(() => {
    mocks.createSupabaseServerClient.mockReset();
    mocks.createServiceClient.mockClear();
  });

  it("rejects unauthenticated requests", async () => {
    const { supabase } = createSupabaseMock({ user: null });
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("uses the session client so RLS scopes visible rooms", async () => {
    const rooms = [
      {
        id: "marriott-room-101",
        room_number: "101",
        hotel_id: "22222222-2222-2222-2222-222222222222",
        hotels: { name: "Marriott Sample" },
      },
    ];
    const { supabase, table, query } = createSupabaseMock({
      user: { id: "marriott-manager" },
      rooms,
    });
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ rooms });
    expect(mocks.createSupabaseServerClient).toHaveBeenCalledOnce();
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(supabase.auth.getUser).toHaveBeenCalledOnce();
    expect(supabase.from).toHaveBeenCalledWith("room_assignments");
    expect(table.select).toHaveBeenCalledWith("*, hotels(name)");
    expect(query.eq).toHaveBeenCalledWith(
      "assignment_date",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
  });
});
