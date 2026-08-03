# ViCheck

Nền tảng quản lý lớp học và theo dõi tiến độ học tập theo checkpoint dành cho giáo viên và học sinh.

[Dùng thử ViCheck](https://vicheck-one.vercel.app) · [Báo lỗi](https://github.com/Datghb/GroupHack/issues)

<p align="center">
  <img src="public/vicheck-logo.png" alt="ViCheck logo" width="180" />
</p>

## Giới thiệu

ViCheck giúp giáo viên tổ chức lớp học, chia khóa, tạo bài tập và theo dõi tiến độ của từng nhóm. Học sinh có thể tham gia lớp, lập hoặc xin vào nhóm, thực hiện checkpoint và theo dõi tiến độ chung.

### Dành cho giáo viên

- Tạo và quản lý lớp học.
- Tổ chức học sinh theo hai khóa trong từng lớp.
- Tạo bài tập với deadline và nhiều checkpoint.
- Chọn checkpoint cá nhân hoặc checkpoint theo nhóm.
- Theo dõi tiến độ lớp, nhóm và từng bài tập.
- Duyệt hoạt động nhóm và quan sát các checkpoint đã hoàn thành.

### Dành cho học sinh

- Tham gia lớp bằng mã lớp.
- Xem bài tập theo đúng khóa đã được phân công.
- Tạo nhóm, xin gia nhập nhóm và duyệt thành viên nếu là trưởng nhóm.
- Hoàn thành checkpoint cá nhân hoặc theo nhóm.
- Xem dashboard tổng quan và tiến độ cộng đồng.

## Công nghệ

- [Next.js 16](https://nextjs.org) và React 19
- TypeScript
- Tailwind CSS v4 và shadcn/ui
- [Supabase](https://supabase.com) cho Auth và PostgreSQL
- TanStack Query, TanStack Form và TanStack Table
- Zod cho kiểm tra dữ liệu
- Vitest cho unit test
- Vercel cho hosting production

## Chạy dự án ở local

### Yêu cầu

- Node.js 20 trở lên
- Bun 1.3 trở lên (khuyến nghị) hoặc npm
- Một project Supabase

### Cài đặt

```bash
git clone https://github.com/Datghb/GroupHack.git
cd GroupHack
bun install
cp env.example.txt .env.local
```

Cập nhật `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SENTRY_DISABLED=true
```

> `SUPABASE_SECRET_KEY` chỉ được sử dụng phía server. Không đổi tên biến này thành biến có tiền tố `NEXT_PUBLIC_` và không commit `.env.local`.

Áp dụng database migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Đồng bộ cấu hình Auth trong `supabase/config.toml` nếu đang dùng project riêng:

```bash
npx supabase config push
```

Khởi động development server:

```bash
bun run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Cấu hình Supabase Auth

Trong Supabase Dashboard, vào **Authentication → URL Configuration** và cấu hình:

- Site URL local: `http://localhost:3000`
- Redirect URL local: `http://localhost:3000/**`
- Site URL production: domain Vercel của dự án
- Redirect URL production: `https://your-domain.vercel.app/**`

Repo hiện cấu hình production cho `https://vicheck-one.vercel.app` trong `supabase/config.toml`.

Người dùng mới mặc định có vai trò `STUDENT`. Để cấp vai trò giáo viên trong môi trường thử nghiệm, cập nhật trường `role` của người dùng trong bảng `public.profiles` thành `TEACHER`.

## Scripts

```bash
bun run dev          # chạy development server
bun run test         # chạy unit tests
bun run lint         # kiểm tra lint
bun run lint:strict  # lint với zero-warning policy
bun run build        # production build
bun run start        # chạy production server đã build
```

## Cấu trúc chính

```text
src/
├── app/
│   ├── api/                    # Route handlers và kiểm tra quyền server-side
│   ├── auth/                   # Đăng nhập, đăng ký và OAuth callback
│   ├── student/                # Luồng dành cho học sinh
│   └── teacher/                # Luồng dành cho giáo viên
├── features/
│   ├── auth/                   # Giao diện Supabase Auth
│   ├── classroom/              # Lớp, bài tập, nhóm và checkpoint
│   └── profile/                # Hồ sơ người dùng
├── components/                 # UI và layout dùng chung
└── lib/                        # Supabase clients, auth và access control

supabase/
├── config.toml                 # Auth URL và cấu hình Supabase
└── migrations/                 # PostgreSQL schema migrations
```

## Mô hình dữ liệu

Các bảng nghiệp vụ chính:

- `profiles`: hồ sơ và vai trò người dùng.
- `classrooms`: lớp học do giáo viên quản lý.
- `class_enrollments`: học sinh và khóa được phân công.
- `classroom_courses`: các khóa trong lớp.
- `assignments`: bài tập của từng khóa.
- `assignment_checkpoints`: checkpoint cá nhân hoặc theo nhóm.
- `assignment_teams` và `assignment_team_members`: nhóm theo bài tập.
- `assignment_team_join_requests`: yêu cầu gia nhập nhóm.
- `checkpoint_completions`: trạng thái hoàn thành checkpoint.

Các API sử dụng Supabase secret key ở server và thực hiện kiểm tra quyền trước khi truy cập dữ liệu. RLS vẫn được bật trên các bảng nghiệp vụ để ngăn truy cập trực tiếp từ client.

## Kiểm thử trước khi phát hành

```bash
bun run test
bun run lint:strict
bun run build
```

Hiện tại bộ unit test tập trung vào deadline, phạm vi checkpoint, trạng thái hoàn thành và cách tính tiến độ học sinh. Khi mở rộng production, nên bổ sung integration test cho API và Playwright E2E cho các luồng giáo viên/học sinh quan trọng.

## Deploy lên Vercel

1. Import repository vào Vercel hoặc liên kết bằng Vercel CLI.
2. Thêm các biến môi trường được liệt kê ở phần cài đặt.
3. Đặt `NEXT_PUBLIC_APP_URL` thành domain production.
4. Đặt `NEXT_PUBLIC_SENTRY_DISABLED=true` nếu chưa cấu hình Sentry.
5. Cập nhật Site URL và Redirect URLs trong Supabase Auth.
6. Chạy migrations trước khi mời người dùng thử nghiệm.

Deploy bằng CLI:

```bash
npx vercel login
npx vercel link
npx vercel deploy --prod
```

Production hiện tại: **https://vicheck-one.vercel.app**

## Giới hạn môi trường thử nghiệm

ViCheck hiện được vận hành bằng Vercel và Supabase Free. Đây là cấu hình phù hợp cho pilot nhỏ; nên giới hạn khoảng 50 người thao tác đồng thời cho đến khi có kết quả load test. Theo dõi database size, egress, function invocations và lỗi API trong dashboard của hai nền tảng.

## Đóng góp

1. Tạo branch từ `main`.
2. Thực hiện thay đổi và bổ sung test phù hợp.
3. Chạy test, lint và production build.
4. Mở pull request, mô tả thay đổi và cách kiểm thử.
