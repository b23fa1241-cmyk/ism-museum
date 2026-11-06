-- Supabase > SQL Editor дээр бүтнээр нь ажиллуулна.
create table profiles(id uuid primary key references auth.users on delete cascade,
  display_name text, avatar_url text, role text not null default 'student', created_at timestamptz default now());
create table exhibits(id bigint generated always as identity primary key, title text not null, description text,
  image_url text, category text, technology_stack text, year_created int, creator_id uuid default auth.uid() references profiles(id),
  demo_url text, github_url text, status text default 'published', created_at timestamptz default now());
create table teachers(id bigint generated always as identity primary key, name text not null, position text, courses text, bio text, photo_url text);
create table events(id bigint generated always as identity primary key, title text not null, event_date date, description text, cover_image_url text);
create table event_photos(id bigint generated always as identity primary key, event_id bigint references events(id) on delete cascade, image_url text, caption text);
create table history(id bigint generated always as identity primary key, year int not null, title text not null, description text, image_url text);

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,display_name) values(new.id, split_part(new.email,'@',1)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create function is_admin() returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

alter table profiles enable row level security; alter table exhibits enable row level security;
alter table teachers enable row level security; alter table events enable row level security;
alter table event_photos enable row level security; alter table history enable row level security;

create policy "read" on profiles for select using (true);
create policy "own profile" on profiles for update using (id=auth.uid())
  with check (id=auth.uid() and role=(select role from profiles where id=auth.uid()));
create policy "read" on exhibits for select using (true);
create policy "add own" on exhibits for insert to authenticated with check (creator_id=auth.uid());
create policy "edit own" on exhibits for update using (creator_id=auth.uid() or is_admin());
create policy "delete own" on exhibits for delete using (creator_id=auth.uid() or is_admin());
do $$ declare t text; begin foreach t in array array['teachers','events','event_photos','history'] loop
  execute format('create policy "read" on %I for select using (true)', t);
  execute format('create policy "admin write" on %I for all using (is_admin()) with check (is_admin())', t);
end loop; end $$;

insert into storage.buckets(id,name,public) values('images','images',true);
create policy "img read" on storage.objects for select using (bucket_id='images');
create policy "img upload" on storage.objects for insert to authenticated with check (bucket_id='images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "img delete" on storage.objects for delete using (bucket_id='images' and ((storage.foldername(name))[1]=auth.uid()::text or is_admin()));

-- Өөрийгөө админ болгох (бүртгүүлсний дараа, имэйлээ солиод ажиллуулна):
-- update profiles set role='admin' where id=(select id from auth.users where email='ТАНЫ@ИМЭЙЛ');
