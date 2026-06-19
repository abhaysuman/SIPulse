"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { ChartCandle, ChartPeriod, FinancialsData, NewsItem, QuoteData, SearchResult } from "@/lib/types";
import { ChartPanel } from "@/components/ChartPanel";
import { FinancialsPanel } from "@/components/FinancialsPanel";
import { NewsPanel } from "@/components/NewsPanel";
import { ResearchPanel } from "@/components/ResearchPanel";
import { SearchBar } from "@/components/SearchBar";
import { SimulatorPanel } from "@/components/SimulatorPanel";
import { StockHeader } from "@/components/StockHeader";

type LoadErrors = Partial<Record<"quote" | "chart" | "news" | "financials", string>>;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data as T;
}

export function SIPulseApp() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [activeName, setActiveName] = useState("Apple Inc.");
  const [period, setPeriod] = useState<ChartPeriod>("1Y");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [chartData, setChartData] = useState<ChartCandle[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [financials, setFinancials] = useState<FinancialsData | null>(null);
  const [errors, setErrors] = useState<LoadErrors>({});
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("sipulse-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("sipulse-theme", theme);
  }, [theme]);

  const loadChart = useCallback(async (symbol: string, nextPeriod: ChartPeriod) => {
    setChartLoading(true);
    setErrors((current) => ({ ...current, chart: undefined }));
    try {
      const nextChart = await fetchJson<ChartCandle[]>(
        `/api/chart?ticker=${encodeURIComponent(symbol)}&period=${nextPeriod}`,
      );
      setChartData(nextChart);
    } catch (error) {
      setChartData([]);
      setErrors((current) => ({ ...current, chart: error instanceof Error ? error.message : "Unable to load chart." }));
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadTicker = useCallback(async (symbol: string, name?: string, selectedPeriod: ChartPeriod = "1Y") => {
    setLoading(true);
    setActiveSymbol(symbol);
    setActiveName(name ?? symbol);
    setErrors({});

    const [quoteResult, chartResult, newsResult, financialsResult] = await Promise.allSettled([
      fetchJson<QuoteData>(`/api/quote?ticker=${encodeURIComponent(symbol)}`),
      fetchJson<ChartCandle[]>(`/api/chart?ticker=${encodeURIComponent(symbol)}&period=${selectedPeriod}`),
      fetchJson<NewsItem[]>(`/api/news?ticker=${encodeURIComponent(symbol)}`),
      fetchJson<FinancialsData>(`/api/financials?ticker=${encodeURIComponent(symbol)}`),
    ]);

    const nextErrors: LoadErrors = {};

    if (quoteResult.status === "fulfilled") setQuote(quoteResult.value);
    else {
      setQuote(null);
      nextErrors.quote = quoteResult.reason instanceof Error ? quoteResult.reason.message : "Unable to load quote.";
    }

    if (chartResult.status === "fulfilled") setChartData(chartResult.value);
    else {
      setChartData([]);
      nextErrors.chart = chartResult.reason instanceof Error ? chartResult.reason.message : "Unable to load chart.";
    }

    if (newsResult.status === "fulfilled") setNews(newsResult.value);
    else {
      setNews([]);
      nextErrors.news = newsResult.reason instanceof Error ? newsResult.reason.message : "Unable to load news.";
    }

    if (financialsResult.status === "fulfilled") setFinancials(financialsResult.value);
    else {
      setFinancials(null);
      nextErrors.financials =
        financialsResult.reason instanceof Error ? financialsResult.reason.message : "Unable to load financials.";
    }

    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTicker("AAPL", "Apple Inc.", "1Y");
  }, [loadTicker]);

  const errorList = useMemo(() => Object.values(errors).filter(Boolean), [errors]);

  function handleSelect(result: SearchResult) {
    void loadTicker(result.symbol, result.name, period);
  }

  function handlePeriodChange(nextPeriod: ChartPeriod) {
    setPeriod(nextPeriod);
    void loadChart(activeSymbol, nextPeriod);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">SIPulse</p>
              <h1 className="text-xl font-semibold">Stock and SIP research</h1>
            </div>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:border-muted md:hidden"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <SearchBar onSelect={handleSelect} />
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:border-muted md:inline-flex"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5">
        {loading ? <div className="rounded-md border border-border bg-surface p-3 text-sm text-muted">Loading {activeName}...</div> : null}
        {errorList.length > 0 ? (
          <div className="rounded-md border border-down/40 bg-down/10 p-3 text-sm text-down">
            {errorList.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <StockHeader quote={quote} fallbackSymbol={activeSymbol} />
        <ChartPanel
          data={chartData}
          period={period}
          onPeriodChange={handlePeriodChange}
          loading={chartLoading}
          theme={theme}
        />
        <ResearchPanel ticker={activeSymbol} companyName={quote?.longName ?? activeName} />
        <SimulatorPanel chartData={chartData} quote={quote} />
        <FinancialsPanel data={financials} currency={quote?.currency ?? "USD"} error={errors.financials} />
        <NewsPanel news={news} error={errors.news} />
      </div>
    </main>
  );
}
