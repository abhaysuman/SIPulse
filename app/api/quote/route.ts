import { getQuoteData } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();

  if (!ticker) {
    return Response.json({ error: "Ticker is required." }, { status: 400 });
  }

  try {
    const quote = await getQuoteData(ticker);
    if (quote.currentPrice === null) {
      return Response.json({ error: "Quote not found for this instrument." }, { status: 404 });
    }
    return Response.json(quote);
  } catch (error) {
    console.error("quote route failed", error);
    const message = error instanceof Error ? error.message : "";
    const notFound = /not found|no data|404|invalid|symbol/i.test(message);
    return Response.json(
      { error: notFound ? "Quote not found for this instrument." : "Unable to load quote data." },
      { status: notFound ? 404 : 500 },
    );
  }
}
