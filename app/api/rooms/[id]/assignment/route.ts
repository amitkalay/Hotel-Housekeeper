import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssignmentRequest = {
  roomAttendantId?: unknown;
  expectedUpdatedAt?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing room id" }, { status: 400 });
  }

  let body: AssignmentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { roomAttendantId, expectedUpdatedAt } = body;
  if (
    !(roomAttendantId === null || typeof roomAttendantId === "string") ||
    typeof expectedUpdatedAt !== "string"
  ) {
    return NextResponse.json(
      { error: "roomAttendantId must be a string or null, and expectedUpdatedAt is required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: room, error: roomError } = await supabase
    .from("room_assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: managerMembership, error: membershipError } = await supabase
    .from("user_hotels")
    .select("hotel_id, role")
    .eq("user_id", userData.user.id)
    .eq("hotel_id", room.hotel_id)
    .eq("role", "manager")
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }
  if (!managerMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (roomAttendantId !== null) {
    const { data: attendant, error: attendantError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", roomAttendantId)
      .eq("hotel_id", room.hotel_id)
      .eq("role", "attendant")
      .maybeSingle();

    if (attendantError) {
      return NextResponse.json({ error: attendantError.message }, { status: 500 });
    }
    if (!attendant) {
      return NextResponse.json(
        { error: "Attendant must belong to the same hotel as the room" },
        { status: 400 }
      );
    }
  }

  const { data: updatedRoom, error: updateError } = await supabase
    .from("room_assignments")
    .update({ room_attendant_id: roomAttendantId })
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedRoom) {
    const { data: latestRoom, error: latestError } = await supabase
      .from("room_assignments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (latestError) {
      return NextResponse.json({ error: latestError.message }, { status: 500 });
    }
    if (!latestRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Room was updated by someone else. Please review the latest assignment.", room: latestRoom },
      { status: 409 }
    );
  }

  return NextResponse.json({ room: updatedRoom });
}
