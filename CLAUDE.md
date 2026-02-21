# AI News Hub - 项目说明

## 项目简介
AI 资讯聚合网站，自动抓取多个来源的 AI 资讯，支持分类筛选和搜索，同时推送到 Telegram。

技术栈：Next.js 15 + TypeScript + Tailwind CSS + Prisma + SQLite（开发）/ PostgreSQL（生产）

## MANDATORY: Agent Workflow

每次新的 agent session 必须按以下步骤执行：

### Step 1: 选择任务
读取 task.json，选择 id 最小的 passes: false 任务。

### Step 2: 实现任务
- 仔细阅读任务描述和 steps
- 按步骤实现功能
- 遵循 Next.js App Router 规范
- TypeScript 严格模式

### Step 3: 测试
- `npm run lint` 无错误
- `npm run build` 构建成功
- UI 修改需验证页面正常渲染

### Step 4: 更新 progress.txt
记录完成的工作内容。

### Step 5: 提交（包含 task.json 更新）
1. 将任务 passes 改为 true
2. 一次性提交所有更改：
```bash
git add . && git commit -m "[任务描述] - completed"
```

## 项目结构
```
ai-news-hub/
├── app/                  # Next.js App Router
│   ├── page.tsx          # 首页
│   ├── article/[id]/     # 详情页
│   └── api/              # API Routes
├── components/           # React 组件
├── prisma/
│   └── schema.prisma     # 数据库模型
├── scripts/              # 抓取和推送脚本
├── lib/                  # 工具函数
├── task.json             # 任务列表
└── progress.txt          # 进度记录
```

## 数据模型
```prisma
model Article {
  id          Int      @id @default(autoincrement())
  title       String
  summary     String
  url         String   @unique
  source      String
  category    String
  publishedAt DateTime
  pushed      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

## 环境变量
```
DATABASE_URL=        # Supabase PostgreSQL URL（生产）
TELEGRAM_BOT_TOKEN=  # Telegram Bot Token
TELEGRAM_CHAT_ID=    # Telegram Chat ID
```

## 命令
```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # 代码检查
npx ts-node scripts/fetch-news.ts   # 手动抓取
npx ts-node scripts/push-telegram.ts # 手动推送
```
