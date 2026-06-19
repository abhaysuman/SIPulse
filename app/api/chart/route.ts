import type { ChartPeriod } from "@/lib/types";
import { getChartData } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const revalidate = 3600;

const periods: ChartPeriod[] = ["1W", "1M", "3M", "6M", "1Y", "3Y", "MAX"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();
  const periodParam = searchParams.get("period") as ChartPeriod | null;
  const period = periodParam && periods.includes(periodParam) ? periodParam : "1Y";

  if (!ticker) {
    return Response.json({ error: "Ticker is required." }, { status: 400 });
  }

  try {
    const data = await getChartData(ticker, period);
    if (data.length === 0) {
      return Response.json({ error: "No chart data found for this instrument." }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("chart route failed", error);
    const message = error instanceof Error ? error.message : "";
    const notFound = /not found|no data|404|invalid|symbol/i.test(message);
    return Response.json(
      { error: notFound ? "No chart data found for this instrument." : "Unable to load chart data." },
      { status: notFound ? 404 : 500 },
    );
  }
}
