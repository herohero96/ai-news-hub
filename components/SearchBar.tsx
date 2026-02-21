"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索资讯标题或摘要…"
        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="清除搜索"
        >
          ✕
        </button>
      )}
    </div>
  );
}
