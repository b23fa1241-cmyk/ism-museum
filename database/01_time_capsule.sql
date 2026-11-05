-- ISM Time Machine: цагийн капсул
create table if not exists time_capsules (
  id bigint generated always as identity primary key,
  author_id uuid references auth.users(id) default auth.uid(),
  author_name text,
  title text not null,
  message text not null,
  image_url text,
  open_year int not null,
  opened boolean not null default false,   -- админ "Одоо нээх" дарахад true болно (хамгаалалтад үзүүлэх зорилготой)
  created_at timestamptz not null default now()
);

alter table time_capsules enable row level security;

-- Нэвтэрсэн хэрэглэгч өөрийн нэрээр капсул үлдээнэ
create policy "capsule insert own" on time_capsules
  for insert to authenticated with check (author_id = auth.uid());

-- Өөрийн болон админ бүх капсулыг харна
create policy "capsule select own or admin" on time_capsules
  for select to authenticated
  using (author_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Өөрийн капсулыг, админ бүгдийг устгана
create policy "capsule delete own or admin" on time_capsules
  for delete to authenticated
  using (author_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Зөвхөн админ нээх/түгжих
create policy "capsule admin update" on time_capsules
  for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Нийтэд харагдах хараат: нээгдэх хүртэл захидал, зураг нь NULL байна
create or replace view capsules_public as
select
  id, author_id, author_name, title, open_year, opened, created_at,
  case when opened or open_year <= extract(year from now())::int then message end as message,
  case when opened or open_year <= extract(year from now())::int then image_url end as image_url
from time_capsules;

grant select on capsules_public to anon, authenticated;

notify pgrst, 'reload schema';
