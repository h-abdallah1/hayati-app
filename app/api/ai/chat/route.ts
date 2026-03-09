export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  let messages: ChatMessage[], model: string, ollamaUrl: string;
  try {
    ({ messages, model, ollamaUrl } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Cannot reach Ollama: ${msg}` },
      { status: 503 }
    );
  }

  if (!ollamaRes.ok) {
    const text = await ollamaRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Ollama error ${ollamaRes.status}: ${text}` },
      { status: ollamaRes.status }
    );
  }

  const reader = ollamaRes.body?.getReader();
  if (!reader) {
    return NextResponse.json({ error: "No response body from Ollama" }, { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buf = "";

      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const token: string = parsed.message?.content ?? "";
              const isDone: boolean = parsed.done ?? false;
              send({ token, done: isDone });
            } catch {
              // skip malformed line
            }
          }
        }
        // flush remaining
        if (buf.trim()) {
          try {
            const parsed = JSON.parse(buf.trim());
            const token: string = parsed.message?.content ?? "";
            send({ token, done: true });
          } catch {
            send({ token: "", done: true });
          }
        } else {
          send({ token: "", done: true });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ error: msg, done: true });
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
