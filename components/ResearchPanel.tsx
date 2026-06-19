"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlaskConical } from "lucide-react";

interface ResearchPanelProps {
  ticker: string;
  companyName: string;
}

export function ResearchPanel({ ticker, companyName }: ResearchPanelProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function runResearch() {
    setLoading(true);
    setContent("");
    try {
      const response = await fetch(`/api/research?ticker=${encodeURIComponent(ticker)}`);
      if (!response.body) {
        setContent(await response.text());
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          setContent((current) => current + decoder.decode(chunk.value, { stream: !done }));
        }
      }
    } catch {
      setContent("Deep research unavailable. Check your NVIDIA NIM API key in .env.local.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Deep research</h2>
          <p className="text-sm text-muted">{companyName}</p>
        </div>
        <button
          type="button"
          onClick={runResearch}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FlaskConical size={16} />
          {loading ? "Researching..." : "Run deep research"}
        </button>
      </div>

      <div className="mt-4 min-h-36 rounded-md border border-border bg-background p-4">
        {content ? (
          <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-muted dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Run research for {ticker}. Missing NVIDIA credentials will show a graceful fallback here.
          </p>
        )}
      </div>
    </section>
  );
}
