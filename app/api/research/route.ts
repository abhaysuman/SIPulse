import OpenAI from "openai";
import { buildResearchPrompt, getNvidiaConfig } from "@/lib/nvidia";
import { getNewsData, getQuoteData } from "@/lib/yahooFinance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fallback = "Deep research unavailable. Check your NVIDIA NIM API key in .env.local.";
const genericFailure =
  "Deep research unavailable right now. The API key is loaded, but the research provider or market-data context request failed.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.trim();

  if (!ticker) {
    return new Response("Ticker is required.", { status: 400 });
  }

  const config = getNvidiaConfig();
  if (!config.apiKey) {
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const [quote, news] = await Promise.all([getQuoteData(ticker), getNewsData(ticker)]);
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
    const stream = await client.chat.completions.create({
      model: config.model,
      max_tokens: 1000,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a senior equity research analyst. Write in concise, direct prose. No hype, no filler, and no investment advice disclaimers.",
        },
        { role: "user", content: buildResearchPrompt(quote, news) },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          console.error("research stream failed", error);
          controller.enqueue(encoder.encode(`\n\n${genericFailure}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("research route failed", error);
    return new Response(genericFailure, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
