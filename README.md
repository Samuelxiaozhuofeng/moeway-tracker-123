# 浸录 ImmerseLog

面向 Moeway / Refold / Dreaming Spanish 风格沉浸学习者的离线优先 PWA。用于记录 raw anime 听力、raw manga / 轻小说阅读、作品进度、生词语块、目标和长期统计。

## 技术栈

- Next.js 15 App Router + TypeScript + Tailwind CSS
- shadcn/ui 风格组件 + Radix UI + lucide-react
- Zustand + TanStack Query
- IndexedDB(Dexie) 离线优先，本地可完整运行
- Supabase Auth / PostgreSQL / Storage / Realtime-ready 同步表
- Recharts + Tremor
- Framer Motion、date-fns、zod、react-hook-form、sonner
- PWA manifest + service worker + 安装到主屏幕 + 离线页面缓存

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## Supabase 配置

1. 新建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/migrations/0001_immerselog.sql`。
3. 复制 `.env.example` 为 `.env.local`，填入：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

未配置 Supabase 时，App 仍会完全使用本地 IndexedDB 工作；配置后可在“我 → 云同步”使用 magic link 登录并同步。

## 部署到 Vercel

1. 将仓库导入 Vercel。
2. Framework Preset 选择 Next.js。
3. 配置 Supabase 环境变量。
4. 部署后在浏览器安装 PWA 到主屏幕。

## 核心数据流

1. 所有写入先落 IndexedDB，记录 `syncState`。
2. TanStack Query 读取本地数据并驱动页面。
3. 在线且登录 Supabase 后，`syncWithSupabase()` 将 dirty/deleted 实体 upsert 到 `immerselog_entities`。
4. 拉取远端实体后写回 IndexedDB，离线记录自动补同步。

## 半路用户逻辑

在作品架添加作品时，如果填写“已完成 X 集/章”和“干净分钟/集”，系统会自动创建一条历史导入记录：

```text
历史分钟数 = 已完成集/章 × 每集/章干净分钟数
```

这条记录会计入对应语言和听力/阅读类型的总时长、统计图、热力图和里程碑。

## 常用命令

```bash
npm run lint
npm run build
```
