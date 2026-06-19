import { getNewsData } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const revalidate = 1800;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();

  if (!ticker) {
    return Response.json({ error: "Ticker is required." }, { status: 400 });
  }

  try {
    const news = await getNewsData(ticker);
    return Response.json(news);
  } catch (error) {
    console.error("news route failed", error);
    return Response.json({ error: "Unable to load news." }, { status: 500 });
  }
}
