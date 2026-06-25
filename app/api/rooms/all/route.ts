import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("room_assignments")
    .select("*, hotels(name)")
    .eq("assignment_date", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rooms: data });
}
