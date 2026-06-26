import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BoardClient } from "./board-client";
import type { RoomAssignment, Staff, UserHotelMembership } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: rooms }, { data: attendants }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("room_assignments")
        .select("*")
        .eq("assignment_date", today)
        .order("room_number", { ascending: true }),
      supabase
        .from("staff")
        .select("*")
        .eq("role", "attendant")
        .order("full_name", { ascending: true }),
      supabase
        .from("user_hotels")
        .select("hotel_id, role")
        .eq("user_id", userData.user.id),
    ]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Room Board — {today}</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/rooms-all" className="text-primary underline">
            View all rooms (beta)
          </Link>
          <span className="text-muted-foreground">{userData.user.email}</span>
        </nav>
      </header>
      <BoardClient
        initialRooms={(rooms ?? []) as RoomAssignment[]}
        attendants={(attendants ?? []) as Staff[]}
        memberships={(memberships ?? []) as UserHotelMembership[]}
      />
    </main>
  );
}
