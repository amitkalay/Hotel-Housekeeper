-- hotels
create table hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table user_hotels (
  user_id uuid references auth.users(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  primary key (user_id, hotel_id)
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('attendant', 'inspector', 'manager')),
  created_at timestamptz not null default now()
);

create table room_assignments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  room_number text not null,
  room_type text not null,
  status text not null,
  room_attendant_id uuid references staff(id) on delete set null,
  assignment_date date not null default current_date,
  is_vip boolean not null default false,
  is_dnd boolean not null default false,
  has_pets boolean not null default false,
  remarks text,
  updated_at timestamptz not null default now(),
  unique (hotel_id, room_number, assignment_date)
);

create table board_activity_log (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  assignment_date date not null default current_date,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table hotels enable row level security;
alter table user_hotels enable row level security;
alter table staff enable row level security;
alter table room_assignments enable row level security;
alter table board_activity_log enable row level security;

create policy "users see their hotels"
  on hotels for select
  using (id in (select hotel_id from user_hotels where user_id = auth.uid()));

create policy "users see their user_hotels rows"
  on user_hotels for select
  using (user_id = auth.uid());

create policy "users see staff at their hotels"
  on staff for select
  using (hotel_id in (select hotel_id from user_hotels where user_id = auth.uid()));

create policy "users see room_assignments at their hotels"
  on room_assignments for select
  using (hotel_id in (select hotel_id from user_hotels where user_id = auth.uid()));

create policy "users update room_assignments at their hotels"
  on room_assignments for update
  using (hotel_id in (select hotel_id from user_hotels where user_id = auth.uid()));

create policy "users see board_activity_log at their hotels"
  on board_activity_log for select
  using (hotel_id in (select hotel_id from user_hotels where user_id = auth.uid()));

create or replace function log_room_change() returns trigger as $$
begin
  insert into board_activity_log(hotel_id, assignment_date, event_type, payload)
  values (new.hotel_id, new.assignment_date, 'room_updated',
          jsonb_build_object('room_id', new.id, 'status', new.status));
  return new;
end;
$$ language plpgsql security definer;

create trigger room_assignments_change_log
  after update on room_assignments
  for each row execute function log_room_change();

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger room_assignments_touch_updated_at
  before update on room_assignments
  for each row execute function touch_updated_at();

alter publication supabase_realtime add table room_assignments;
alter publication supabase_realtime add table board_activity_log;
