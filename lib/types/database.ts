export type RoomStatus = "VC" | "VD" | "OC" | "OOO";
export type RoomType = "KING" | "QUEEN" | "SUITE";
export type HotelUserRole = "attendant" | "inspector" | "manager";

export type RoomAssignment = {
  id: string;
  hotel_id: string;
  room_number: string;
  room_type: RoomType;
  status: RoomStatus;
  room_attendant_id: string | null;
  assignment_date: string;
  is_vip: boolean;
  is_dnd: boolean;
  has_pets: boolean;
  remarks: string | null;
  updated_at: string;
};

export type Staff = {
  id: string;
  hotel_id: string;
  full_name: string;
  role: HotelUserRole;
};

export type UserHotelMembership = {
  hotel_id: string;
  role: HotelUserRole;
};
