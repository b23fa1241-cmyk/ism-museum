# ISM Digital Museum

Мэдээллийн системийн менежментийн тэнхимийн түүх, багш нар, арга хэмжээ болон оюутнуудын бүтээлийг нэг дор хадгалж, олон нийтэд хүргэх дижитал музей.

- "Ажиллаж буй хувилбар:" `<DEPLOY URL>`
- "GitHub repository:" `<REPOSITORY URL>`

## 1. Төслийн зорилго

Тэнхимийн түүх, багш нар, арга хэмжээ болон оюутнуудын бүтээлийг нэг системд төвлөрүүлэн хадгалах, хайх, үзэх боломж бүрдүүлэхэд оршино. Мөн цагийн капсулын тусламжтайгаар ирээдүйн оюутнуудад зориулсан захидал, дурсамжийг хадгалж, тэнхимийн өнгөрсөн, одоо, ирээдүйг холбох зорилготой.

## 2. Ашигласан технологи

- "Frontend:" React, Vite, CSS
- "Backend болон өгөгдлийн сан:" Supabase (PostgreSQL, Authentication, Storage, Row Level Security)
- "Байршуулалт (Hosting):" Vercel

## 3. Суулгах заавар

"Алхам 1. Repository-г татах"

```bash
git clone <REPOSITORY_URL>
cd ism-museum
npm install
```

"Алхам 2. Supabase төсөл үүсгэх"

[Supabase](https://supabase.com) платформд нэвтэрч шинэ төсөл үүсгэнэ.

"Алхам 3. Өгөгдлийн сан тохируулах"

Supabase-ийн SQL Editor хэсэгт `database/` хавтас дахь SQL файлуудыг дарааллаар нь ажиллуулна.

"Алхам 4. Storage тохируулах"

Supabase-ийн Storage хэсэгт `images` нэртэй Public bucket үүсгэнэ.

"Алхам 5. Орчны хувьсагч тохируулах"

Төслийн үндсэн хавтаст `.env` файл үүсгэж, Supabase-ийн URL болон API түлхүүрийг оруулна.

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

"Алхам 6. Төслийг ажиллуулах"

```bash
npm run dev
```

Хөтөч дээр `http://localhost:5173` хаягаар нээнэ.

"Алхам 7. Админ эрх тохируулах"

Системд бүртгүүлсний дараа хэрэглэгчийн UUID-г ашиглан Supabase-ийн SQL Editor дээр дараах командыг ажиллуулна.

```sql
update profiles
set role = 'admin'
where id = '<ХЭРЭГЛЭГЧИЙН UUID>';
```

> "Анхааруулга:" `service_role` түлхүүрийг GitHub repository-д байршуулж болохгүй. `.env` файлыг `.gitignore`-д бүртгэсэн байна.