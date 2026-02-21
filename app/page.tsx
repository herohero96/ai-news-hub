import { prisma } from "@/lib/prisma";
import CategoryNav from "@/components/CategoryNav";
import ArticleCard from "@/components/ArticleCard";

const CATEGORIES = ["全部", "Claude", "OpenAI", "Google", "其他"];

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const activeCategory = category && CATEGORIES.includes(category) ? category : "全部";

  const articles = await prisma.article.findMany({
    where: activeCategory !== "全部" ? { category: activeCategory } : undefined,
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            AI News Hub
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            汇集最新 AI 行业动态
          </p>
        </div>
        <CategoryNav categories={CATEGORIES} active={activeCategory} />
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              {activeCategory !== "全部"
                ? `暂无「${activeCategory}」分类的资讯`
                : "暂无资讯，请先运行抓取脚本"}
            </p>
            <code className="mt-3 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded">
              npx ts-node scripts/fetch-news.ts
            </code>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
