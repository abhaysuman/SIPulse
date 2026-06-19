"use client";

import { useMemo, useState } from "react";
import type { ChartCandle, ProjectionPoint, QuoteData } from "@/lib/types";
import { buildHistoricalBacktest, buildProjectionSeries, historicalCAGR } from "@/lib/calculations";
import { formatCurrency, formatPercent, inputCurrencyPrefix } from "@/lib/formatters";

interface SimulatorPanelProps {
  chartData: ChartCandle[];
  quote: QuoteData | null;
}

type InvestmentType = "sip" | "lumpSum";
type ReturnMode = "auto" | "manual" | "conservative" | "moderate" | "aggressive";

export function SimulatorPanel({ chartData, quote }: SimulatorPanelProps) {
  const currency = quote?.currency ?? "USD";
  const [type, setType] = useState<InvestmentType>("sip");
  const [amount, setAmount] = useState(5000);
  const [years, setYears] = useState(10);
  const [mode, setMode] = useState<ReturnMode>("auto");
  const [manualRate, setManualRate] = useState(12);
  const [inflation, setInflation] = useState(true);
  const [backtest, setBacktest] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const autoRate = useMemo(() => historicalCAGR(chartData), [chartData]);
  const rate = useMemo(() => {
    if (mode === "manual") return manualRate;
    if (mode === "conservative") return 8;
    if (mode === "moderate") return 12;
    if (mode === "aggressive") return 16;
    return autoRate ?? 12;
  }, [autoRate, manualRate, mode]);

  const projection = useMemo(() => {
    if (backtest) {
      const historical = buildHistoricalBacktest({
        type,
        amount,
        startDate: `${startDate}-01`,
        data: chartData,
        inflationRate: inflation ? 6 : 0,
      });
      if (historical.length > 1) return historical;
    }

    return buildProjectionSeries({
      type,
      amount,
      annualRate: rate,
      years,
      inflationRate: inflation ? 6 : 0,
    });
  }, [amount, backtest, chartData, inflation, rate, startDate, type, years]);

  const last = projection[projection.length - 1];
  const invested = last?.invested ?? 0;
  const value = last?.value ?? 0;
  const returns = value - invested;
  const realValue = last?.realValue ?? value;

  return (
    <section className="rounded-md border border-border bg-surface p-5 shadow-[0_18px_55px_-42px_rgba(22,30,45,0.55)] lg:p-6 dark:shadow-none">
      <div>
        <h2 className="text-lg font-semibold">SIP / lump-sum simulator</h2>
        {mode === "auto" && autoRate === null ? <p className="text-sm text-muted">Using 12% because chart history is limited.</p> : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="grid gap-3 rounded-md border border-border bg-panel p-4">
          <div className="grid grid-cols-2 gap-2">
            <Choice active={type === "sip"} label="SIP" onClick={() => setType("sip")} />
            <Choice active={type === "lumpSum"} label="Lump sum" onClick={() => setType("lumpSum")} />
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">{type === "sip" ? "Monthly amount" : "One-time amount"}</span>
            <div className="flex h-10 items-center rounded-md border border-border bg-surface">
              <span className="px-3 text-muted">{inputCurrencyPrefix(currency)}</span>
              <input
                type="number"
                value={amount}
                min={0}
                step={500}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="h-full flex-1 bg-transparent pr-3 font-mono outline-none"
              />
            </div>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Duration</span>
            <input
              type="range"
              min={1}
              max={40}
              value={years}
              onChange={(event) => setYears(Number(event.target.value))}
              className="accent-blue"
            />
            <span className="font-mono text-xs">{years} years</span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Expected return</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as ReturnMode)}
              className="h-10 rounded-md border border-border bg-surface px-3 outline-none"
            >
              <option value="auto">Auto historical CAGR</option>
              <option value="manual">Manual</option>
              <option value="conservative">Conservative 8%</option>
              <option value="moderate">Moderate 12%</option>
              <option value="aggressive">Aggressive 16%</option>
            </select>
          </label>

          {mode === "manual" ? (
            <label className="grid gap-1 text-sm">
              <span className="text-muted">Manual return</span>
              <input
                type="number"
                value={manualRate}
                onChange={(event) => setManualRate(Number(event.target.value))}
                className="h-10 rounded-md border border-border bg-surface px-3 font-mono outline-none"
              />
            </label>
          ) : null}

          <label className="grid gap-1 text-sm">
            <span className="text-muted">Backtest start</span>
            <input
              type="month"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 font-mono outline-none"
            />
          </label>

          <label className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <span>Show historical backtest</span>
            <input type="checkbox" checked={backtest} onChange={(event) => setBacktest(event.target.checked)} />
          </label>

          <label className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <span>Inflation adjusted</span>
            <input type="checkbox" checked={inflation} onChange={(event) => setInflation(event.target.checked)} />
          </label>
        </div>

        <div className="grid gap-3">
          <div className="h-[360px] rounded-md border border-border bg-panel p-3">
            <ProjectionSvg data={projection} showReal={inflation} currency={currency} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Invested" value={formatCurrency(invested, currency)} />
            <Metric label="Est. returns" value={formatCurrency(returns, currency)} tone={returns >= 0 ? "up" : "down"} />
            <Metric label="Total value" value={formatCurrency(value, currency)} />
            <Metric label="CAGR" value={formatPercent(rate)} />
          </div>
          {inflation ? <p className="text-sm text-muted">Inflation-adjusted value: {formatCurrency(realValue, currency)}</p> : null}
        </div>
      </div>
    </section>
  );
}

function ProjectionSvg({ data, showReal, currency }: { data: ProjectionPoint[]; showReal: boolean; currency: string }) {
  if (data.length < 2) return <div className="flex h-full items-center justify-center text-sm text-muted">Not enough data.</div>;
  const values = data.flatMap((point) => [point.invested, point.value, showReal ? point.realValue : 0]);
  const max = Math.max(...values, 1);
  const toPath = (key: "invested" | "value" | "realValue") =>
    data
      .map((point, index) => {
        const x = 6 + (index / (data.length - 1)) * 88;
        const y = 90 - (point[key] / max) * 76;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  const last = data[data.length - 1];

  return (
    <div className="relative h-full">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {[20, 40, 60, 80].map((y) => (
          <path key={y} d={`M 6 ${y} L 94 ${y}`} stroke="var(--border)" strokeWidth="0.25" />
        ))}
        <path d={`${toPath("value")} L 94 90 L 6 90 Z`} fill="color-mix(in srgb, var(--up) 16%, transparent)" />
        <path d={toPath("invested")} fill="none" stroke="var(--muted)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <path d={toPath("value")} fill="none" stroke="var(--up)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        {showReal ? <path d={toPath("realValue")} fill="none" stroke="var(--orange)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      <div className="absolute left-3 top-3 rounded-md border border-border bg-surface/90 px-3 py-2 text-xs shadow">
        <p className="text-muted">Final value</p>
        <p className="font-mono font-semibold">{formatCurrency(last.value, currency)}</p>
      </div>
    </div>
  );
}

function Choice({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-md border text-sm transition ${
        active ? "border-blue bg-blue/15 text-blue" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-md border border-border bg-panel p-3">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>
        {value}
      </p>
    </div>
  );
}
