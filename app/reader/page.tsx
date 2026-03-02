"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useTheme } from "@/lib/theme";

type ArticleData = {
  title?: string;
  content?: string;
  author?: string;
  published?: string;
  image?: string;
  source?: string;
};

function ReaderContent() {
  const C = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) { setLoading(false); setError(true); return; }
    setLoading(true);
    setError(false);
    setArticle(null);
    fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(true);
        else setArticle(data);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  const proseStyles = `
    .reader-content { font-family: 'JetBrains Mono',monospace; font-size: 13px; line-height: 1.75; color: ${C.text}; }
    .reader-content p { margin: 0 0 14px; }
    .reader-content h1, .reader-content h2 { font-family: 'Syne',sans-serif; font-weight: 800; margin: 24px 0 10px; color: ${C.text}; }
    .reader-content h3, .reader-content h4 { font-family: 'Syne',sans-serif; margin: 18px 0 8px; color: ${C.textMuted}; }
    .reader-content a { color: ${C.accent}; text-decoration: none; }
    .reader-content a:hover { text-decoration: underline; }
    .reader-content img { max-width: 100%; border-radius: 4px; margin: 12px 0; display: block; }
    .reader-content figure { margin: 12px 0; }
    .reader-content figcaption { font-size: 10px; color: ${C.textFaint}; margin-top: 4px; font-family: 'JetBrains Mono',monospace; }
    .reader-content blockquote { border-left: 2px solid ${C.border}; margin: 14px 0; padding: 4px 14px; color: ${C.textFaint}; }
    .reader-content ul, .reader-content ol { padding-left: 20px; margin: 0 0 14px; }
    .reader-content li { margin-bottom: 4px; }
    .reader-content code { font-family: inherit; background: ${C.surfaceHi}; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
    .reader-content pre { background: ${C.surfaceHi}; padding: 12px 14px; border-radius: 6px; overflow-x: auto; margin: 0 0 14px; }
    .reader-content table { width: 100%; border-collapse: collapse; margin: 0 0 14px; font-size: 12px; }
    .reader-content th, .reader-content td { padding: 6px 10px; border: 1px solid ${C.border}; text-align: left; }
    .reader-content th { color: ${C.textMuted}; }
  `;

  const publishedStr = article?.published
    ? new Date(article.published).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{proseStyles}</style>

      {/* Top bar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        padding: "10px 28px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 5,
            cursor: "pointer",
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: C.textMuted,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
          }}
        >
          <ArrowLeft size={12} /> back
        </button>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: C.textFaint,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              textDecoration: "none",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textFaint)}
          >
            open externally <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 28px 80px" }}>

        {loading && (
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            color: C.textFaint,
            textAlign: "center",
            paddingTop: 80,
          }}>
            fetching article…
          </div>
        )}

        {error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 80 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>
              could not extract article content
            </span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: C.accent,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                open in browser <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {!loading && !error && article && (
          <>
            {/* Source + date */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
            }}>
              {article.source && (
                <span style={{ color: C.accent, fontWeight: 700, letterSpacing: "0.4px" }}>
                  {article.source.toUpperCase()}
                </span>
              )}
              {article.author && (
                <span style={{ color: C.textFaint }}>· {article.author}</span>
              )}
              {publishedStr && (
                <span style={{ color: C.textFaint }}>· {publishedStr}</span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1.3,
              color: C.text,
              margin: "0 0 20px",
            }}>
              {article.title}
            </h1>

            {/* Hero image */}
            {article.image && (
              <img
                src={article.image}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 6,
                  marginBottom: 24,
                  border: `1px solid ${C.border}`,
                  display: "block",
                }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}

            {/* Article body */}
            <div
              className="reader-content"
              dangerouslySetInnerHTML={{ __html: article.content ?? "" }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense>
      <ReaderContent />
    </Suspense>
  );
}
