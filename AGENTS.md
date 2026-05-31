# AGENTS.md

本文件是 `浸录 / ImmerseLog` 的 repo 级开发指南。全局工程规则另行继承；这里仅记录本项目特有的架构、命令、边界和易踩坑。

## 项目定位

- 这是一个面向 Moeway / Refold / Dreaming Spanish 风格沉浸学习者的线上 PWA。
- 当前生产站点部署在 Vercel：`https://immerselog.vercel.app`。
- Supabase 是正式后端；用户必须使用邮箱 + 密码登录后才能进入 App。
- IndexedDB 作为本地缓存和弱网缓冲层，不再作为唯一数据归宿。

## 技术栈约束

- Next.js 15 App Router + TypeScript + Tailwind CSS。
- React 固定使用 18.x；不要升级到 React 19，除非先确认 Tremor peer dependency 已支持。
- UI 风格沿用现有 Radix/shadcn 风格组件，基础组件放在 `src/components/ui/`。
- 本地缓存使用 Dexie IndexedDB，线上持久化使用 Supabase JSONB entity sync。
- 统计图使用 Recharts / Tremor；动效使用 Framer Motion。
- 测试使用 Vitest + fake-indexeddb。

## 目录职责

- `src/app/`：App Router 页面、路由和 API route。页面文件保持薄层，尽量组合组件和 hooks。
- `src/components/`：UI 组件。按领域拆分到 `analytics/`、`app/`、`library/`、`records/`、`timer/`、`vocab/` 等目录。
- `src/lib/db/`：IndexedDB 数据访问和本地业务写入逻辑。
- `src/lib/supabase/`：Supabase client 与同步逻辑。
- `src/lib/stats/`：统计派生计算。
- `src/lib/api/`：外部 API 请求封装，例如媒体搜索。
- `src/lib/data/`：TanStack Query hooks 和默认数据。
- `src/store/`：Zustand 客户端状态，例如 timer/filter。
- `src/types/domain.ts`：领域类型和领域 label。
- `src/test/`：测试 setup 与测试工厂。
- `public/manifest.webmanifest`、`public/sw.js`：PWA manifest 和 service worker。
- `supabase/migrations/`：Supabase schema / RLS / storage migration。

## 数据流规则

- 所有用户写入先落 IndexedDB，并维护 `syncState`，随后自动同步到 Supabase。
- 前端必须经过 `AuthGate` 登录门禁；不要新增绕过登录的核心页面入口。
- 切换登录账号时必须隔离本地缓存，避免不同账号共享 IndexedDB 数据。
- UI 读取优先通过 TanStack Query hooks，不要在页面组件里直接散落 Dexie 查询。
- 新增或修改实体类型时，必须同步检查：
  - `src/types/domain.ts`
  - `src/lib/db/database.ts`
  - 对应 `src/lib/db/*.ts`
  - `src/lib/supabase/sync.ts`
  - backup import/export
  - 相关测试
- 删除记录或作品时沿用现有软删除思路，避免直接破坏同步语义。
- 半路用户逻辑很关键：添加作品时如果有已完成集/章，需要创建历史导入 session，并计入统计。

## 模块化要求

- 新功能默认拆文件：组件、hooks、DB 逻辑、统计计算、类型、常量分别归位。
- 不要在 `src/app/page.tsx` 或其他 page 文件里堆多个复杂组件。
- DB 写入逻辑不要写进 React 组件；放到 `src/lib/db/`。
- 统计派生逻辑不要写进页面；放到 `src/lib/stats/` 或独立模块。
- 表单组件可以放在对应领域目录，例如 `src/components/library/`、`src/components/records/`。

## 常用命令

```bash
npm run test
npm run lint
npm run build
```

本地开发：

```bash
npm run dev
```

打开 `http://localhost:3000`。

## 验证要求

- 改 DB 逻辑、统计逻辑、导入导出、同步逻辑时，优先补 Vitest 测试。
- 至少运行与变更相关的测试；收尾前优先运行：
  - `npm run test`
  - `npm run lint`
  - `npm run build`
- 如果浏览器里已有 `next dev` 在跑，不要一边保持旧 dev server 一边直接跑 `npm run build` 后继续使用旧页面。生产构建会改写 `.next`，可能导致 dev server 出现 chunk 错位，例如 `Cannot find module './331.js'`。如需 build 验证，构建后重启 dev server 或清理 `.next` 后再启动。
- 不要用 `npm audit fix --force` 处理 audit notice，除非明确接受依赖树破坏风险并重新验证 React/Tremor 兼容性。

## 测试约定

- DB 测试放在对应模块旁边，例如 `src/lib/db/works.test.ts`。
- 共享测试数据工厂放在 `src/test/factories.ts`。
- IndexedDB 测试依赖 `src/test/setup.ts`，不要在业务代码里为测试环境加 fallback。
- 不要为了让测试通过而弱化断言；如果测试失败，先假设业务逻辑或测试前提需要核实。

## UI / UX 约定

- 这是一个日常高频使用工具，不要做营销型 landing page。
- 优先移动端体验和快速记录路径；新增交互要减少记录摩擦。
- 首页要保持 Dashboard 工作台属性：开始沉浸、今日目标、统计摘要、继续记录、最近记录。
- 作品架、历史、生词、统计、设置各自保持清晰边界，不要跨页面塞重复逻辑。
- 使用 lucide-react 图标和现有按钮/输入/弹窗组件。
- 避免大面积单一色系和装饰性渐变；保持信息密度、可扫描性和克制视觉。

## PWA 注意事项

- `public/sw.js` 是手写 service worker，修改缓存策略时必须验证离线访问和更新行为。
- manifest 修改后要确认图标、名称、display、theme color 仍适合安装到主屏幕。
- 不要让 service worker 缓存 API 写入请求或用户私有数据响应。

## Supabase 注意事项

- Supabase 是生产后端，不是可选增强功能。
- 当前生产项目 ref：`oggsjjlhbzltefmptewl`。
- 登录方式是邮箱 + 密码；不要恢复 magic link 登录，除非用户明确要求。
- 不要在源码中硬编码 Supabase URL、anon key 以外的敏感信息；本项目使用 `.env.local`。
- 修改同步 schema 时要新增 migration，并检查 RLS。
- `immerselog_entities` 使用 JSONB entity sync；新增实体需确保本地 entity 与远端 payload 可往返。

## Vercel 注意事项

- 当前生产项目：`immerselog`，生产域名：`https://immerselog.vercel.app`。
- Vercel Framework Preset 必须是 `nextjs`，不要改回 `Other`。
- 生产环境必须配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- 详细部署记录和验收项见 `deployment.md`。

## 当前已覆盖的关键测试

- 添加作品时自动创建历史导入记录。
- session 更新后作品进度按 delta 回算。
- session 切换作品时进度转移。
- session 删除后进度扣回并软删除。
- backup JSON 导出/导入 round-trip。
- backup version 校验。
- session CSV 导出转义。

## 开发优先级建议

1. 核心记录链路稳定性：计时器、手动补录、session 编辑/删除、进度回算。
2. 统计可信度：周/月回顾、streak、热力图、语言/类型占比。
3. 数据可迁移性：JSON/CSV 导入导出、Supabase sync、离线恢复。
4. 表单效率：批量补录、作品季/集信息、阅读页数/章节模式。
5. PWA 体验：离线可用、安装体验、通知和 wake lock。
