import { getFinancialsData } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();

  if (!ticker) {
    return Response.json({ error: "Ticker is required." }, { status: 400 });
  }

  try {
    const financials = await getFinancialsData(ticker);
    return Response.json(financials);
  } catch (error) {
    console.error("financials route failed", error);
    return Response.json({ error: "Unable to load financials." }, { status: 500 });
  }
}
