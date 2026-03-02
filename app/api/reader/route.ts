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
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
    return NextResponse.json({
      title: article.title,
      content,
      author: article.author,
      published: article.published,
      image: article.image,
      source: article.source,
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" });
  }
}
