"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  Time,
  createChart,
} from "lightweight-charts";
import type { ChartCandle, ChartPeriod } from "@/lib/types";
import { macd, rsi, sma } from "@/lib/calculations";
import type { IndicatorPoint, MacdPoint } from "@/lib/types";

interface ChartPanelProps {
  data: ChartCandle[];
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
  loading: boolean;
  theme: "light" | "dark";
}

const periods: ChartPeriod[] = ["1W", "1M", "3M", "6M", "1Y", "3Y", "MAX"];

export function ChartPanel({ data, period, onPeriodChange, loading, theme }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(false);
  const [showRsi, setShowRsi] = useState(false);
  const [showMacd, setShowMacd] = useState(false);

  const rsiData = useMemo(() => rsi(data), [data]);
  const macdData = useMemo(() => macd(data), [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) return;

    container.innerHTML = "";
    const dark = theme === "dark";
    const chart = createChart(container, {
      autoSize: true,
      height: 420,
      layout: {
        background: { color: dark ? "#0a0a0f" : "#f8f8fc" },
        textColor: dark ? "#6b6b8a" : "#5a5a7a",
      },
      grid: {
        vertLines: { color: dark ? "#1e1e2e" : "#e2e2ec" },
        horzLines: { color: dark ? "#1e1e2e" : "#e2e2ec" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#00c896",
      downColor: "#ff4d6a",
      borderVisible: false,
      wickUpColor: "#00c896",
      wickDownColor: "#ff4d6a",
    });

    candles.setData(
      data.map((item) => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      })),
    );

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    volume.setData(
      data.map((item) => ({
        time: item.time as Time,
        value: item.volume,
        color: item.close >= item.open ? "rgba(0, 200, 150, 0.35)" : "rgba(255, 77, 106, 0.35)",
      })),
    );

    if (showSma50) {
      const series = chart.addSeries(LineSeries, { color: "#4d9eff", lineWidth: 2, priceLineVisible: false });
      series.setData(sma(data, 50).map((point) => ({ time: point.time as Time, value: point.value })));
    }

    if (showSma200) {
      const series = chart.addSeries(LineSeries, { color: "#ff8c42", lineWidth: 2, priceLineVisible: false });
      series.setData(sma(data, 200).map((point) => ({ time: point.time as Time, value: point.value })));
    }

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [data, showSma50, showSma200, theme]);

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Price chart</h2>
          <p className="text-sm text-muted">Candles, volume, and technical overlays</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onPeriodChange(item)}
              className={`h-8 rounded-md border px-3 font-mono text-xs transition ${
                item === period ? "border-blue bg-blue/15 text-blue" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[420px] rounded-md border border-border bg-background">
        {loading ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-muted">Loading chart...</div>
        ) : data.length === 0 ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-muted">No chart data available.</div>
        ) : (
          <div ref={containerRef} className="h-[420px] w-full" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Toggle active={showSma50} label="SMA 50" onClick={() => setShowSma50((value) => !value)} />
        <Toggle active={showSma200} label="SMA 200" onClick={() => setShowSma200((value) => !value)} />
        <Toggle active={showRsi} label="RSI" onClick={() => setShowRsi((value) => !value)} />
        <Toggle active={showMacd} label="MACD" onClick={() => setShowMacd((value) => !value)} />
      </div>

      {showRsi ? (
        <IndicatorFrame title="RSI">
          <LineSvg data={rsiData} min={0} max={100} stroke="#4d9eff" />
        </IndicatorFrame>
      ) : null}

      {showMacd ? (
        <IndicatorFrame title="MACD">
          <MacdSvg data={macdData} />
        </IndicatorFrame>
      ) : null}
    </section>
  );
}

function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-md border px-3 text-sm transition ${
        active ? "border-blue bg-blue/15 text-blue" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function IndicatorFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-background p-3">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function LineSvg({ data, min, max, stroke }: { data: IndicatorPoint[]; min?: number; max?: number; stroke: string }) {
  if (data.length < 2) return <div className="flex h-32 items-center justify-center text-sm text-muted">Not enough data.</div>;
  const values = data.map((point) => point.value);
  const low = min ?? Math.min(...values);
  const high = max ?? Math.max(...values);
  const range = high - low || 1;
  const path = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 40 - ((point.value - low) / range) * 36 - 2;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-32 w-full overflow-visible">
      <path d="M 0 20 L 100 20" stroke="var(--border)" strokeWidth="0.4" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MacdSvg({ data }: { data: MacdPoint[] }) {
  if (data.length < 2) return <div className="flex h-32 items-center justify-center text-sm text-muted">Not enough data.</div>;
  const values = data.flatMap((point) => [point.macd, point.signal, point.histogram]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = high - low || 1;
  const y = (value: number) => 40 - ((value - low) / range) * 36 - 2;
  const line = (key: "macd" | "signal") =>
    data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y(point[key]).toFixed(2)}`;
      })
      .join(" ");
  const zero = y(0);

  return (
    <svg viewBox="0 0 100 40" className="h-32 w-full overflow-visible">
      <path d={`M 0 ${zero} L 100 ${zero}`} stroke="var(--border)" strokeWidth="0.4" />
      {data.map((point, index) => {
        const x = (index / data.length) * 100;
        const barWidth = Math.max(0.25, 80 / data.length);
        const barY = Math.min(y(point.histogram), zero);
        const height = Math.abs(y(point.histogram) - zero);
        return <rect key={point.time} x={x} y={barY} width={barWidth} height={height} fill="var(--muted)" opacity="0.6" />;
      })}
      <path d={line("macd")} fill="none" stroke="#4d9eff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <path d={line("signal")} fill="none" stroke="#ff8c42" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
