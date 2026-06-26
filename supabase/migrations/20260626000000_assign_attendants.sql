alter table user_hotels
  add column if not exists role text not null default 'attendant';

alter table user_hotels
  drop constraint if exists user_hotels_role_check;

alter table user_hotels
  add constraint user_hotels_role_check
  check (role in ('attendant', 'inspector', 'manager'));

update user_hotels as uh
set role = case
  when u.email like 'manager-%@%.example' then 'manager'
  when u.email like 'attendant-%@%.example' then 'attendant'
  else uh.role
end
from auth.users as u
where u.id = uh.user_id;

drop policy if exists "users update room_assignments at their hotels"
  on room_assignments;

drop policy if exists "managers update room_assignments at their hotels"
  on room_assignments;

create policy "managers update room_assignments at their hotels"
  on room_assignments for update
  using (
    exists (
      select 1
      from user_hotels
      where user_hotels.user_id = auth.uid()
        and user_hotels.hotel_id = room_assignments.hotel_id
        and user_hotels.role = 'manager'
    )
  )
  with check (
    exists (
      select 1
      from user_hotels
      where user_hotels.user_id = auth.uid()
        and user_hotels.hotel_id = room_assignments.hotel_id
        and user_hotels.role = 'manager'
    )
    and (
      room_assignments.room_attendant_id is null
      or exists (
        select 1
        from staff
        where staff.id = room_assignments.room_attendant_id
          and staff.hotel_id = room_assignments.hotel_id
          and staff.role = 'attendant'
      )
    )
  );

grant usage on schema public to anon, authenticated, service_role;

grant select on hotels, user_hotels, staff, room_assignments, board_activity_log
  to anon, authenticated, service_role;

grant update on room_assignments
  to authenticated, service_role;

grant insert, update, delete on hotels, user_hotels, staff, room_assignments, board_activity_log
  to service_role;

grant usage, select on all sequences in schema public
  to service_role;
