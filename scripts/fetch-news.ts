/**
 * fetch-news.ts
 * 抓取多个 AI 资讯来源，解析文章并存入数据库（去重）
 * 运行: npx tsx scripts/fetch-news.ts
 */

import * as cheerio from "cheerio";
import RSSParser from "rss-parser";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const rss = new RSSParser();

interface ArticleInput {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
}

// ─── 分类判断 ────────────────────────────────────────────────────────────────

function detectCategory(title: string, source: string): string {
  const t = title.toLowerCase();
  if (t.includes("claude") || source.includes("anthropic")) return "Claude";
  if (t.includes("openai") || t.includes("chatgpt") || t.includes("gpt"))
    return "OpenAI";
  if (
    t.includes("google") ||
    t.includes("gemini") ||
    t.includes("deepmind") ||
    source.includes("google")
  )
    return "Google";
  return "其他";
}

// ─── 来源抓取函数 ─────────────────────────────────────────────────────────────

async function fetchAiviFyi(): Promise<ArticleInput[]> {
  const articles: ArticleInput[] = [];
  try {
    const res = await fetch("https://aivi.fyi/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AINewsBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $("article, .post, .entry, .item").each((_, el) => {
      const titleEl = $(el).find("h1, h2, h3, a").first();
      const title = titleEl.text().trim();
      const href = titleEl.attr("href") || $(el).find("a").first().attr("href");
      const summary =
        $(el).find("p, .summary, .excerpt").first().text().trim() || title;
      if (!title || !href) return;
      const url = href.startsWith("http") ? href : `https://aivi.fyi${href}`;
      articles.push({
        title,
        summary: summary.slice(0, 500),
        url,
        source: "aivi.fyi",
        category: detectCategory(title, "aivi.fyi"),
        publishedAt: new Date(),
      });
    });

    // fallback: grab all links with meaningful text
    if (articles.length === 0) {
      $("a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");
        if (!title || title.length < 20 || !href) return;
        const url = href.startsWith("http") ? href : `https://aivi.fyi${href}`;
        articles.push({
          title,
          summary: title,
          url,
          source: "aivi.fyi",
          category: detectCategory(title, "aivi.fyi"),
          publishedAt: new Date(),
        });
      });
    }
  } catch (e) {
    console.warn("[aivi.fyi] 抓取失败:", (e as Error).message);
  }
  return articles.slice(0, 20);
}

async function fetchSimonWillison(): Promise<ArticleInput[]> {
  const articles: ArticleInput[] = [];
  try {
    const feed = await rss.parseURL("https://simonwillison.net/atom/everything/");
    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;
      articles.push({
        title: item.title,
        summary: (item.contentSnippet || item.summary || item.title).slice(
          0,
          500
        ),
        url: item.link,
        source: "simonwillison.net",
        category: detectCategory(item.title, "simonwillison.net"),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      });
    }
  } catch (e) {
    console.warn("[simonwillison.net] 抓取失败:", (e as Error).message);
  }
  return articles;
}

async function fetchAnthropic(): Promise<ArticleInput[]> {
  const articles: ArticleInput[] = [];
  try {
    const res = await fetch("https://www.anthropic.com/news", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AINewsBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $("a[href*='/news/']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href === "/news") return;
      const url = href.startsWith("http")
        ? href
        : `https://www.anthropic.com${href}`;
      const title =
        $(el).find("h2, h3, h4").text().trim() ||
        $(el).attr("aria-label") ||
        $(el).text().trim();
      if (!title || title.length < 5) return;
      const summary =
        $(el).find("p").text().trim() || title;
      articles.push({
        title,
        summary: summary.slice(0, 500),
        url,
        source: "anthropic.com",
        category: "Claude",
        publishedAt: new Date(),
      });
    });
  } catch (e) {
    console.warn("[anthropic.com] 抓取失败:", (e as Error).message);
  }
  // dedupe by url within this source
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  }).slice(0, 20);
}

async function fetchGoogleAI(): Promise<ArticleInput[]> {
  const articles: ArticleInput[] = [];
  try {
    // Google AI blog RSS
    const feed = await rss.parseURL(
      "https://blog.google/technology/ai/rss/"
    );
    for (const item of feed.items.slice(0, 20)) {
      if (!item.title || !item.link) continue;
      articles.push({
        title: item.title,
        summary: (item.contentSnippet || item.summary || item.title).slice(
          0,
          500
        ),
        url: item.link,
        source: "blog.google",
        category: "Google",
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      });
    }
  } catch (e) {
    console.warn("[blog.google] RSS 失败，尝试 HTML:", (e as Error).message);
    try {
      const res = await fetch("https://blog.google/technology/ai/", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AINewsBot/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      $("article a, h3 a, h2 a").each((_, el) => {
        const href = $(el).attr("href");
        const title = $(el).text().trim();
        if (!href || !title || title.length < 10) return;
        const url = href.startsWith("http")
          ? href
          : `https://blog.google${href}`;
        articles.push({
          title,
          summary: title,
          url,
          source: "blog.google",
          category: "Google",
          publishedAt: new Date(),
        });
      });
    } catch (e2) {
      console.warn("[blog.google] HTML 抓取也失败:", (e2 as Error).message);
    }
  }
  return articles.slice(0, 20);
}

// ─── 存库（去重） ─────────────────────────────────────────────────────────────

async function saveArticles(articles: ArticleInput[]): Promise<number> {
  let saved = 0;
  for (const article of articles) {
    try {
      await prisma.article.upsert({
        where: { url: article.url },
        update: {},
        create: article,
      });
      saved++;
    } catch {
      // 已存在则跳过
    }
  }
  return saved;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 开始抓取 AI 资讯...\n");

  const [aivi, simon, anthropic, google] = await Promise.all([
    fetchAiviFyi(),
    fetchSimonWillison(),
    fetchAnthropic(),
    fetchGoogleAI(),
  ]);

  console.log(`📰 aivi.fyi:          ${aivi.length} 篇`);
  console.log(`📰 simonwillison.net: ${simon.length} 篇`);
  console.log(`📰 anthropic.com:     ${anthropic.length} 篇`);
  console.log(`📰 blog.google:       ${google.length} 篇`);

  const all = [...aivi, ...simon, ...anthropic, ...google];
  console.log(`\n📦 合计: ${all.length} 篇，开始去重存库...`);

  const saved = await saveArticles(all);
  console.log(`✅ 新增入库: ${saved} 篇`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
