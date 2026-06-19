declare module "yahoo-finance2" {
  interface SearchOptions {
    newsCount?: number;
    quotesCount?: number;
  }

  interface HistoricalOptions {
    period1: Date;
    period2: Date;
    interval: "1d" | "1wk";
  }

  interface HistoricalRow {
    date: Date;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }

  class YahooFinance {
    search(query: string, options?: SearchOptions): Promise<unknown>;
    historical(symbol: string, options: HistoricalOptions): Promise<HistoricalRow[]>;
    quoteSummary(symbol: string, options: { modules: string[] }): Promise<unknown>;
    quote(symbol: string): Promise<unknown>;
  }

  export default YahooFinance;
}
