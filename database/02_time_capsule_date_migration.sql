-- Капсулын нээгдэх хугацааг он биш, яг өдрөөр (календарь) хадгалах

alter table time_capsules add column if not exists open_date date;

-- Өмнө үүсгэсэн капсулууд: тухайн оны 1-р сарын 1 болгоно
update time_capsules set open_date = make_date(open_year, 1, 1) where open_date is null;

alter table time_capsules alter column open_date set not null;

-- Нийтэд харагдах хараат: Улаанбаатарын цагаар нээгдэх өдөр ирэх хүртэл агуулга нь NULL
drop view if exists capsules_public;

create view capsules_public as
select
  id, author_id, author_name, title, open_year, open_date, opened, created_at,
  case when opened or open_date <= (now() at time zone 'Asia/Ulaanbaatar')::date then message end as message,
  case when opened or open_date <= (now() at time zone 'Asia/Ulaanbaatar')::date then image_url end as image_url
from time_capsules;

grant select on capsules_public to anon, authenticated;

notify pgrst, 'reload schema';
