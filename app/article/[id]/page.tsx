import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const CATEGORY_COLORS: Record<string, string> = {
  Claude: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  OpenAI: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Google: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  其他: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) notFound();

  const article = await prisma.article.findUnique({ where: { id: articleId } });

  if (!article) notFound();

  const tagClass = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS["其他"];

  const publishedDate = new Date(article.publishedAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
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
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* 面包屑导航 */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            首页
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
            {article.title}
          </span>
        </nav>

        <article className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
          {/* 分类标签 */}
          <div className="mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tagClass}`}>
              {article.category}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
            {article.title}
          </h1>

          {/* 元信息 */}
          <div className="mt-3 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{article.source}</span>
            <span>·</span>
            <time dateTime={article.publishedAt.toISOString()}>{publishedDate}</time>
          </div>

          {/* 摘要 */}
          {article.summary && (
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-300 leading-relaxed border-l-4 border-zinc-200 dark:border-zinc-700 pl-4">
              {article.summary}
            </p>
          )}

          {/* 查看原文按钮 */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              查看原文
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <Link
              href="/"
              className="ml-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              ← 返回首页
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
