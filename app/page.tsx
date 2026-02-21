import { prisma } from "@/lib/prisma";
import CategoryNav from "@/components/CategoryNav";
import ArticleList from "@/components/ArticleList";

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
    take: 100,
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
        <ArticleList articles={articles} />
      </main>
    </div>
  );
}
