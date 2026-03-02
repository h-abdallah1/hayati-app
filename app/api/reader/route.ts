import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    const article = await extract(url);
    if (!article) {
      return NextResponse.json({ error: "fetch_failed" });
    }
    const content = (article.content ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      // Readability often prepends the title as the first <h1> — strip it to avoid duplication
      .replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
    return NextResponse.json({
      title: article.title,
      content,
      author: article.author,
      published: article.published,
      source: article.source,
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" });
  }
}
