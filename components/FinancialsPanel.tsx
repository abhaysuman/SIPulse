"use client";

import { useMemo, useState } from "react";
import type { FinancialRow, FinancialsData } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface FinancialsPanelProps {
  data: FinancialsData | null;
  currency: string;
  error?: string;
}

type Tab = "income" | "balance" | "cashflow";

const tabLabels: Record<Tab, string> = {
  income: "Revenue",
  balance: "Balance sheet",
  cashflow: "Cash flow",
};

const keys: Record<Tab, { key: keyof FinancialRow; label: string; color: string }[]> = {
  income: [
    { key: "revenue", label: "Revenue", color: "#4d9eff" },
    { key: "operatingIncome", label: "Operating income", color: "#00c896" },
    { key: "netIncome", label: "Net income", color: "#ff8c42" },
  ],
  balance: [
    { key: "totalAssets", label: "Assets", color: "#4d9eff" },
    { key: "totalLiabilities", label: "Liabilities", color: "#ff4d6a" },
    { key: "shareholderEquity", label: "Equity", color: "#00c896" },
  ],
  cashflow: [
    { key: "operatingCashFlow", label: "Operating CF", color: "#4d9eff" },
    { key: "freeCashFlow", label: "Free CF", color: "#00c896" },
    { key: "capex", label: "CapEx", color: "#ff8c42" },
  ],
};

export function FinancialsPanel({ data, currency, error }: FinancialsPanelProps) {
  const [active, setActive] = useState<Tab>("income");
  const rows = useMemo(() => data?.[active] ?? [], [active, data]);
  const hasData = useMemo(() => rows.some((row) => keys[active].some((item) => typeof row[item.key] === "number")), [active, rows]);

  return (
    <section className="rounded-md border border-border bg-surface p-5 lg:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Financials</h2>
          <p className="text-sm text-muted">Annual fundamentals where Yahoo Finance provides them</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tabLabels) as Tab[]).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActive(tab)}
              className={`h-8 rounded-md border px-3 text-sm transition ${
                active === tab ? "border-blue bg-blue/15 text-blue" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-md border border-border bg-background p-4">
        {error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : !hasData ? (
          <p className="text-sm text-muted">Fundamental data not available for this instrument.</p>
        ) : (
          <>
            <div className="h-[320px]">
              <FinancialBars rows={rows} metrics={keys[active]} currency={currency} />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="py-2">Period</th>
                    {keys[active].map((item) => (
                      <th key={item.key} className="py-2">
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.period} className="border-t border-border">
                      <td className="py-2 font-mono">{row.period}</td>
                      {keys[active].map((item) => (
                        <td key={item.key} className="py-2 font-mono">
                          {formatCurrency(row[item.key] as number | null | undefined, currency)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FinancialBars({
  rows,
  metrics,
  currency,
}: {
  rows: FinancialRow[];
  metrics: { key: keyof FinancialRow; label: string; color: string }[];
  currency: string;
}) {
  const values = rows.flatMap((row) => metrics.map((metric) => Number(row[metric.key] ?? 0)));
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);
  const groupWidth = 88 / Math.max(rows.length, 1);
  const barWidth = groupWidth / (metrics.length + 1);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {[20, 40, 60, 80].map((y) => (
        <path key={y} d={`M 7 ${y} L 96 ${y}`} stroke="var(--border)" strokeWidth="0.25" />
      ))}
      {rows.map((row, rowIndex) => {
        const xStart = 8 + rowIndex * groupWidth;
        return (
          <g key={row.period}>
            {metrics.map((metric, metricIndex) => {
              const value = Number(row[metric.key] ?? 0);
              const height = Math.min(74, (Math.abs(value) / max) * 74);
              const x = xStart + metricIndex * barWidth;
              const y = value >= 0 ? 84 - height : 84;
              return <rect key={metric.key} x={x} y={y} width={barWidth * 0.72} height={height} fill={metric.color} rx="0.8" />;
            })}
            <text x={xStart} y="96" fill="var(--muted)" fontSize="3">
              {row.period}
            </text>
          </g>
        );
      })}
      <text x="8" y="8" fill="var(--muted)" fontSize="3.5">
        {formatCurrency(max, currency)}
      </text>
    </svg>
  );
}
