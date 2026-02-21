"use client";

import Link from "next/link";

interface CategoryNavProps {
  categories: string[];
  active: string;
}

export default function CategoryNav({ categories, active }: CategoryNavProps) {
  return (
    <div className="mx-auto max-w-4xl px-4">
      <nav className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
        {categories.map((cat) => {
          const href = cat === "全部" ? "/" : `/?category=${encodeURIComponent(cat)}`;
          const isActive = cat === active;
          return (
            <Link
              key={cat}
              href={href}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
