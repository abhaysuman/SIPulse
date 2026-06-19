import type { NewsItem } from "@/lib/types";
import { formatRelativeDate } from "@/lib/formatters";

interface NewsPanelProps {
  news: NewsItem[];
  error?: string;
}

export function NewsPanel({ news, error }: NewsPanelProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold">Latest news</h2>
        <p className="text-sm text-muted">Yahoo Finance news with lightweight local sentiment tags</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : news.length === 0 ? (
          <p className="text-sm text-muted">No recent news found.</p>
        ) : (
          news.map((item, index) => (
            <a
              key={`${item.title}-${index}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-background p-4 transition hover:border-muted"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{item.publisher}</span>
                <span className={`rounded border px-2 py-0.5 text-xs ${sentimentClass(item.sentiment)}`}>{item.sentiment}</span>
              </div>
              <h3 className="text-sm font-medium leading-6">{item.title}</h3>
              <p className="mt-3 text-xs text-muted">{formatRelativeDate(item.publishedAt)}</p>
            </a>
          ))
        )}
      </div>
    </section>
  );
}

function sentimentClass(sentiment: NewsItem["sentiment"]) {
  if (sentiment === "Positive") return "border-up/40 bg-up/10 text-up";
  if (sentiment === "Negative") return "border-down/40 bg-down/10 text-down";
  return "border-border bg-surface text-muted";
}
