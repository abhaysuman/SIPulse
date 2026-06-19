import { describe, expect, it } from "vitest";
import { historicalCAGR, lumpSumFutureValue, sipFutureValue, sma } from "../lib/calculations";
import type { ChartCandle } from "../lib/types";

describe("investment calculations", () => {
  it("handles zero-rate SIP future value without division by zero", () => {
    expect(sipFutureValue(1000, 0, 2)).toBe(24000);
  });

  it("calculates lump-sum future value", () => {
    expect(Math.round(lumpSumFutureValue(10000, 10, 2))).toBe(12100);
  });

  it("calculates historical CAGR from first and last price", () => {
    const data: ChartCandle[] = [
      { time: "2024-01-01", open: 100, high: 100, low: 100, close: 100, volume: 1 },
      { time: "2026-01-01", open: 121, high: 121, low: 121, close: 121, volume: 1 },
    ];
    expect(historicalCAGR(data)).toBeCloseTo(10, 1);
  });

  it("creates SMA points after the requested period", () => {
    const data: ChartCandle[] = [
      { time: "2026-01-01", open: 1, high: 1, low: 1, close: 1, volume: 1 },
      { time: "2026-01-02", open: 2, high: 2, low: 2, close: 2, volume: 1 },
      { time: "2026-01-03", open: 3, high: 3, low: 3, close: 3, volume: 1 },
    ];
    expect(sma(data, 2)).toEqual([
      { time: "2026-01-02", value: 1.5 },
      { time: "2026-01-03", value: 2.5 },
    ]);
  });
});
