import type { ChartCandle, IndicatorPoint, MacdPoint, ProjectionPoint } from "@/lib/types";

export function sipFutureValue(monthlyAmount: number, annualRate: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
}

export function lumpSumFutureValue(principal: number, annualRate: number, years: number) {
  return principal * Math.pow(1 + annualRate / 100, years);
}

export function historicalCAGR(prices: Pick<ChartCandle, "time" | "close">[]) {
  if (prices.length < 2) return null;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (!first.close || !last.close || first.close <= 0 || last.close <= 0) return null;

  const start = new Date(first.time);
  const end = new Date(last.time);
  const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return null;
  return (Math.pow(last.close / first.close, 1 / years) - 1) * 100;
}

export function buildProjectionSeries(options: {
  type: "sip" | "lumpSum";
  amount: number;
  annualRate: number;
  years: number;
  inflationRate: number;
}): ProjectionPoint[] {
  const months = Math.max(1, Math.round(options.years * 12));
  const monthlyRate = options.annualRate / 100 / 12;
  const monthlyInflation = options.inflationRate / 100 / 12;
  const points: ProjectionPoint[] = [];

  for (let month = 0; month <= months; month += 1) {
    const label = `M${month}`;
    const invested = options.type === "sip" ? options.amount * month : options.amount;
    const value =
      options.type === "sip"
        ? month === 0
          ? 0
          : monthlyRate === 0
            ? invested
            : options.amount * ((Math.pow(1 + monthlyRate, month) - 1) / monthlyRate) * (1 + monthlyRate)
        : options.amount * Math.pow(1 + monthlyRate, month);
    const realValue = value / Math.pow(1 + monthlyInflation, month);

    points.push({ month: label, invested, value, realValue });
  }

  return points;
}

export function buildHistoricalBacktest(options: {
  type: "sip" | "lumpSum";
  amount: number;
  startDate: string;
  data: ChartCandle[];
  inflationRate: number;
}): ProjectionPoint[] {
  const start = new Date(options.startDate);
  const monthly = new Map<string, ChartCandle>();

  for (const candle of options.data) {
    const date = new Date(candle.time);
    if (Number.isNaN(date.getTime()) || date < start || candle.close <= 0) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly.has(key)) monthly.set(key, candle);
  }

  let shares = 0;
  let invested = 0;
  let lumpBought = false;
  const points: ProjectionPoint[] = [];

  Array.from(monthly.entries()).forEach(([month, candle], index) => {
    if (options.type === "sip") {
      shares += options.amount / candle.close;
      invested += options.amount;
    } else if (!lumpBought) {
      shares = options.amount / candle.close;
      invested = options.amount;
      lumpBought = true;
    }

    const value = shares * candle.close;
    const realValue = value / Math.pow(1 + options.inflationRate / 100 / 12, index);
    points.push({ month, invested, value, realValue });
  });

  return points;
}

export function xirr(cashflows: { date: Date; amount: number }[]) {
  if (cashflows.length < 2) return null;
  const start = cashflows[0].date.getTime();
  let rate = 0.1;

  for (let iteration = 0; iteration < 50; iteration += 1) {
    let value = 0;
    let derivative = 0;

    for (const cashflow of cashflows) {
      const years = (cashflow.date.getTime() - start) / (365.25 * 24 * 60 * 60 * 1000);
      const base = Math.pow(1 + rate, years);
      value += cashflow.amount / base;
      derivative -= (years * cashflow.amount) / Math.pow(1 + rate, years + 1);
    }

    if (Math.abs(derivative) < 1e-10) break;
    const next = rate - value / derivative;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - rate) < 1e-7) return next * 100;
    rate = next;
  }

  return Number.isFinite(rate) ? rate * 100 : null;
}

export function sma(data: ChartCandle[], period: number): IndicatorPoint[] {
  return data
    .map((point, index) => {
      if (index < period - 1) return null;
      const slice = data.slice(index - period + 1, index + 1);
      return {
        time: point.time,
        value: slice.reduce((sum, item) => sum + item.close, 0) / period,
      };
    })
    .filter((point): point is IndicatorPoint => point !== null);
}

export function rsi(data: ChartCandle[], period = 14): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  if (data.length <= period) return points;

  for (let index = period; index < data.length; index += 1) {
    let gains = 0;
    let losses = 0;
    for (let inner = index - period + 1; inner <= index; inner += 1) {
      const change = data[inner].close - data[inner - 1].close;
      if (change >= 0) gains += change;
      else losses += Math.abs(change);
    }
    const averageGain = gains / period;
    const averageLoss = losses / period;
    const value = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
    points.push({ time: data[index].time, value });
  }

  return points;
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  values.forEach((value, index) => {
    if (index === 0) output.push(value);
    else output.push((value - output[index - 1]) * multiplier + output[index - 1]);
  });
  return output;
}

export function macd(data: ChartCandle[]): MacdPoint[] {
  if (data.length < 35) return [];
  const closes = data.map((point) => point.close);
  const fast = ema(closes, 12);
  const slow = ema(closes, 26);
  const macdLine = fast.map((value, index) => value - slow[index]);
  const signal = ema(macdLine, 9);

  return data.slice(26).map((point, index) => {
    const offset = index + 26;
    return {
      time: point.time,
      macd: macdLine[offset],
      signal: signal[offset],
      histogram: macdLine[offset] - signal[offset],
    };
  });
}
