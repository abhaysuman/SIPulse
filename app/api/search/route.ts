import { searchInstruments } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) return Response.json([]);

  try {
    const results = await searchInstruments(query);
    return Response.json(results);
  } catch (error) {
    console.error("search route failed", error);
    return Response.json({ error: "Unable to search instruments." }, { status: 500 });
  }
}
