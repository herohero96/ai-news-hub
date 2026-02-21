import Link from "next/link";
import { ArticleModel } from "@/app/generated/prisma/models/Article";

const CATEGORY_COLORS: Record<string, string> = {
  Claude: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  OpenAI: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Google: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  其他: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function ArticleCard({ article }: { article: ArticleModel }) {
  const tagClass =
    CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS["其他"];

  return (
    <Link
      href={`/article/${article.id}`}
      className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
            {article.title}
          </h2>
          {article.summary && (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagClass}`}>
              {article.category}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {article.source}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatDate(article.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
