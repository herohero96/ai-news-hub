/**
 * push-telegram.ts
 * 读取未推送的资讯，格式化后发送到 Telegram，并标记已推送
 * 运行: npx tsx scripts/push-telegram.ts
 */

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 每次最多推送条数，避免刷屏
const BATCH_SIZE = 10;

function escapeMarkdown(text: string): string {
  // Telegram MarkdownV2 需要转义这些字符
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function formatArticle(article: {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
}): string {
  const categoryEmoji: Record<string, string> = {
    Claude: "🟠",
    OpenAI: "🟢",
    Google: "🔵",
    其他: "⚪",
  };
  const emoji = categoryEmoji[article.category] ?? "⚪";
  const title = escapeMarkdown(article.title);
  const summary = escapeMarkdown(
    article.summary.length > 200
      ? article.summary.slice(0, 200) + "…"
      : article.summary
  );
  const source = escapeMarkdown(article.source);
  const category = escapeMarkdown(article.category);
  const url = article.url.replace(/[()]/g, "\\$&");

  return (
    `${emoji} *${title}*\n` +
    `${summary}\n\n` +
    `📌 ${source} \\| ${category}\n` +
    `🔗 [查看原文](${url})`
  );
}

async function sendMessage(text: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("⚠️  未配置 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID，跳过发送");
    return false;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: false,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Telegram API 错误 ${res.status}: ${body}`);
    return false;
  }
  return true;
}

async function main() {
  console.log("📬 开始推送未发送的资讯到 Telegram...\n");

  const unpushed = await prisma.article.findMany({
    where: { pushed: false },
    orderBy: { publishedAt: "desc" },
    take: BATCH_SIZE,
  });

  if (unpushed.length === 0) {
    console.log("✅ 没有新资讯需要推送");
    await prisma.$disconnect();
    return;
  }

  console.log(`📰 找到 ${unpushed.length} 篇未推送资讯\n`);

  let successCount = 0;
  for (const article of unpushed) {
    const message = formatArticle(article);
    const ok = await sendMessage(message);

    if (ok) {
      await prisma.article.update({
        where: { id: article.id },
        data: { pushed: true },
      });
      successCount++;
      console.log(`✅ 已推送: ${article.title.slice(0, 60)}`);
      // 避免触发 Telegram 限流（每秒最多 1 条）
      await new Promise((r) => setTimeout(r, 1100));
    } else {
      console.warn(`⚠️  推送失败，跳过: ${article.title.slice(0, 60)}`);
    }
  }

  console.log(`\n🎉 推送完成：${successCount}/${unpushed.length} 篇成功`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
