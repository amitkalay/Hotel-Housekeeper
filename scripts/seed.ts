import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. Run `supabase start` first and populate .env.local from its output."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HYATT_ID = "11111111-1111-1111-1111-111111111111";
const MARRIOTT_ID = "22222222-2222-2222-2222-222222222222";

type SeedUser = {
  email: string;
  password: string;
  hotelId: string;
  role: "attendant" | "inspector" | "manager";
};

const USERS: SeedUser[] = [
  {
    email: "manager-a@hyatt.example",
    password: "password123",
    hotelId: HYATT_ID,
    role: "manager",
  },
  {
    email: "attendant-a@hyatt.example",
    password: "password123",
    hotelId: HYATT_ID,
    role: "attendant",
  },
  {
    email: "manager-b@marriott.example",
    password: "password123",
    hotelId: MARRIOTT_ID,
    role: "manager",
  },
  {
    email: "attendant-b@marriott.example",
    password: "password123",
    hotelId: MARRIOTT_ID,
    role: "attendant",
  },
];

function staffId(hotel: "h" | "m", idx: number) {
  const h = hotel === "h" ? "1" : "2";
  return `aaaa${h}aaa-aaaa-aaaa-aaaa-${String(idx).padStart(12, "0")}`;
}

function roomId(hotel: "h" | "m", idx: number) {
  const h = hotel === "h" ? "1" : "2";
  return `cccc${h}ccc-cccc-cccc-cccc-${String(idx).padStart(12, "0")}`;
}

const STAFF_NAMES_BY_HOTEL: Record<"h" | "m", { name: string; role: "attendant" | "inspector" | "manager" }[]> = {
  h: [
    { name: "Maria Lopez", role: "attendant" },
    { name: "Jamal Washington", role: "attendant" },
    { name: "Priya Nair", role: "attendant" },
    { name: "Diego Romero", role: "attendant" },
    { name: "Anna Chen", role: "attendant" },
    { name: "Kenji Tanaka", role: "inspector" },
    { name: "Lucia Rossi", role: "inspector" },
    { name: "Sam Patel", role: "manager" },
  ],
  m: [
    { name: "Oluchi Adeyemi", role: "attendant" },
    { name: "Hannah Park", role: "attendant" },
    { name: "Carlos Mendez", role: "attendant" },
    { name: "Yuki Sato", role: "attendant" },
    { name: "Fatima Khan", role: "attendant" },
    { name: "Mike O'Brien", role: "inspector" },
    { name: "Beatriz Souza", role: "inspector" },
    { name: "Jordan Kim", role: "manager" },
  ],
};

const STATUSES = ["VC", "VC", "VC", "VC", "VD", "VD", "VD", "OC", "OC", "OOO"] as const;
const TYPES = ["KING", "QUEEN", "SUITE"] as const;
const REMARKS = [null, null, null, null, null, null, null, "Late checkout requested", "Extra towels", "No service today"] as const;

async function ensureHotels() {
  const { error } = await admin.from("hotels").upsert([
    { id: HYATT_ID, name: "Hyatt Sample" },
    { id: MARRIOTT_ID, name: "Marriott Sample" },
  ]);
  if (error) throw error;
  console.log("hotels: ok");
}

async function ensureAuthUser(u: SeedUser): Promise<string> {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list?.users.find((x) => x.email === u.email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return data.user.id;
}

async function ensureUserHotelLinks() {
  for (const u of USERS) {
    const userId = await ensureAuthUser(u);
    const { error } = await admin
      .from("user_hotels")
      .upsert({ user_id: userId, hotel_id: u.hotelId, role: u.role });
    if (error) throw error;
  }
  console.log("auth users + user_hotels: ok");
}

async function ensureStaff() {
  const rows: { id: string; hotel_id: string; full_name: string; role: string }[] = [];
  STAFF_NAMES_BY_HOTEL.h.forEach((s, i) =>
    rows.push({ id: staffId("h", i + 1), hotel_id: HYATT_ID, full_name: s.name, role: s.role })
  );
  STAFF_NAMES_BY_HOTEL.m.forEach((s, i) =>
    rows.push({ id: staffId("m", i + 1), hotel_id: MARRIOTT_ID, full_name: s.name, role: s.role })
  );
  const { error } = await admin.from("staff").upsert(rows);
  if (error) throw error;
  console.log(`staff: ok (${rows.length} rows)`);
}

async function ensureRooms() {
  const rows: Record<string, unknown>[] = [];

  for (const hotelLetter of ["h", "m"] as const) {
    const hotelId = hotelLetter === "h" ? HYATT_ID : MARRIOTT_ID;
    const attendants = STAFF_NAMES_BY_HOTEL[hotelLetter]
      .map((s, i) => ({ ...s, id: staffId(hotelLetter, i + 1) }))
      .filter((s) => s.role === "attendant");

    let idx = 0;
    for (let floor = 1; floor <= 3; floor++) {
      for (let n = 1; n <= 10; n++) {
        idx += 1;
        const roomNumber = `${floor}${String(n).padStart(2, "0")}`;
        const status = STATUSES[idx % STATUSES.length];
        const type = TYPES[idx % TYPES.length];
        const remarks = REMARKS[idx % REMARKS.length];
        const isVip = idx % 7 === 0;
        const isDnd = idx % 11 === 0;
        const hasPets = idx % 23 === 0;
        const assigned = idx % 10 !== 0;
        const attendantId = assigned ? attendants[idx % attendants.length].id : null;
        rows.push({
          id: roomId(hotelLetter, idx),
          hotel_id: hotelId,
          room_number: roomNumber,
          room_type: type,
          status,
          room_attendant_id: attendantId,
          is_vip: isVip,
          is_dnd: isDnd,
          has_pets: hasPets,
          remarks,
        });
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: delErr } = await admin
    .from("room_assignments")
    .delete()
    .in("hotel_id", [HYATT_ID, MARRIOTT_ID])
    .eq("assignment_date", today);
  if (delErr) throw delErr;

  const { error } = await admin.from("room_assignments").insert(rows);
  if (error) throw error;
  console.log(`room_assignments: ok (${rows.length} rows for ${today})`);
}

async function main() {
  await ensureHotels();
  await ensureUserHotelLinks();
  await ensureStaff();
  await ensureRooms();
  console.log("\nSeed complete. Log in at http://localhost:3000 with:");
  USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
