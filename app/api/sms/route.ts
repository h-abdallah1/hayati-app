import { NextRequest, NextResponse } from "next/server";
import path from "path";
import os from "os";

// Apple epoch offset: seconds between Unix epoch (1970-01-01) and Apple epoch (2001-01-01)
const APPLE_EPOCH_OFFSET = 978307200;

// UAE bank SMS regex patterns: each returns { amount, type, description }
const PATTERNS: Array<{
  regex: RegExp;
  parse: (m: RegExpMatchArray, text: string) => { amount: number; type: "in" | "out"; description: string } | null;
}> = [
  // Emirates NBD: "Payment of AED/USD 27.70 to MERCHANT with Credit Card ending 1234"
  {
    regex: /Payment of [A-Z]{3}\s*([\d,]+\.?\d*)\s+to\s+([^.]+?)\s+with/i,
    parse: (m) => ({
      amount: parseFloat(m[1].replace(/,/g, "")),
      type: "out",
      description: m[2].trim(),
    }),
  },
  // Emirates NBD: "AED 120.00 debited from a/c ... at Merchant"
  {
    regex: /AED\s*([\d,]+\.?\d*)\s*(?:has been\s*)?debited/i,
    parse: (m, text) => {
      const merchant = text.match(/(?:at|@)\s+([A-Za-z0-9 &'-]+?)(?:\s+on|\s+\.|$)/i)?.[1]?.trim();
      return { amount: parseFloat(m[1].replace(/,/g, "")), type: "out", description: merchant || "Debit" };
    },
  },
  // Emirates NBD: "Amount of AED 999.00 from MERCHANT has been credited to your card"
  {
    regex: /Amount of AED\s*([\d,]+\.?\d*)\s+from\s+(.+?)\s+has been credited/i,
    parse: (m) => ({
      amount: parseFloat(m[1].replace(/,/g, "")),
      type: "in",
      description: m[2].trim(),
    }),
  },
  // Emirates NBD credit: "AED 120.00 credited to a/c"
  {
    regex: /AED\s*([\d,]+\.?\d*)\s*(?:has been\s*)?credited/i,
    parse: (m, text) => {
      const from = text.match(/from\s+([A-Za-z0-9 &'-]+?)(?:\s+on|\s+\.|$)/i)?.[1]?.trim();
      return { amount: parseFloat(m[1].replace(/,/g, "")), type: "in", description: from || "Credit" };
    },
  },
  // FAB / ADCB: "Debit AED 45.00 at Merchant"
  {
    regex: /Debit\s+AED\s*([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9 &'-]+)/i,
    parse: (m) => ({
      amount: parseFloat(m[1].replace(/,/g, "")),
      type: "out",
      description: m[2].trim(),
    }),
  },
  // Emirates NBD debit/credit card: "Purchase of AED 123.45 with Debit/Credit Card ending 1234 at MERCHANT, CITY."
  {
    regex: /Purchase of AED\s*([\d,]+\.?\d*)\s+with\s+(?:Debit|Credit) Card\s+ending\s+\d+\s+at\s+([^.]+)/i,
    parse: (m) => ({
      amount: parseFloat(m[1].replace(/,/g, "")),
      type: "out",
      description: m[2].trim(),
    }),
  },
  // Mashreq / generic: "Purchase of AED 15.99 at Merchant"
  {
    regex: /Purchase of AED\s*([\d,]+\.?\d*)\s+at\s+([A-Za-z0-9 &'-]+)/i,
    parse: (m) => ({
      amount: parseFloat(m[1].replace(/,/g, "")),
      type: "out",
      description: m[2].trim(),
    }),
  },
  // DIB / generic withdrawal: "AED 200.00 withdrawn"
  {
    regex: /AED\s*([\d,]+\.?\d*)\s+withdrawn/i,
    parse: (m, text) => {
      const at = text.match(/at\s+([A-Za-z0-9 &'-]+?)(?:\s+on|\s+\.|$)/i)?.[1]?.trim();
      return { amount: parseFloat(m[1].replace(/,/g, "")), type: "out", description: at || "Withdrawal" };
    },
  },
  // Generic credit: "AED 500.00 received" / "AED 500 transferred to your account"
  {
    regex: /AED\s*([\d,]+\.?\d*)\s+(?:received|transferred to your)/i,
    parse: (m) => ({ amount: parseFloat(m[1].replace(/,/g, "")), type: "in", description: "Transfer received" }),
  },
];

function extractText(text: string | null, attributedBody: Buffer | null): string {
  if (text) return text;
  if (!attributedBody) return "";
  try {
    const buf = Buffer.from(attributedBody);
    // Collect all printable ASCII runs >= 5 chars
    const runs: string[] = [];
    let cur = "";
    for (let i = 0; i < buf.length; i++) {
      const c = buf[i];
      if (c >= 0x20 && c <= 0x7e) cur += String.fromCharCode(c);
      else { if (cur.length >= 5) runs.push(cur); cur = ""; }
    }
    if (cur.length >= 5) runs.push(cur);
    // Skip all ObjC class name / archive header runs, take the first real text run
    const skipPattern = /^(streamtyped|NS[A-Z])/;
    const textRun = runs.find(r => !skipPattern.test(r) && r.length > 10);
    if (textRun) return textRun.replace(/^\+[a-z]/i, "").trim();
    return "";
  } catch {
    return "";
  }
}

function parseSms(text: string): { amount: number; type: "in" | "out"; description: string } | null {
  for (const p of PATTERNS) {
    const m = text.match(p.regex);
    if (m) {
      const result = p.parse(m, text);
      if (result && result.amount > 0 && isFinite(result.amount)) return result;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "90", 10);
  const sendersParam = req.nextUrl.searchParams.get("senders") ?? "";
  const senders = sendersParam
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (senders.length === 0) {
    return NextResponse.json({ error: "No senders configured", transactions: [] });
  }

  const dbPath = path.join(os.homedir(), "Library", "Messages", "chat.db");

  let Database: typeof import("better-sqlite3");
  try {
    Database = (await import("better-sqlite3")).default;
  } catch {
    return NextResponse.json({ error: "better-sqlite3 not available", transactions: [] }, { status: 500 });
  }

  let db: InstanceType<typeof Database> | undefined;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const isPermission = msg.includes("SQLITE_CANTOPEN") || msg.includes("unable to open");
    return NextResponse.json({
      error: isPermission
        ? "Cannot open chat.db — grant Full Disk Access to Terminal in System Settings → Privacy & Security"
        : `Failed to open chat.db: ${msg}`,
      transactions: [],
    });
  }

  try {
    // Apple timestamps are nanoseconds since 2001-01-01 in newer macOS, or seconds in older.
    // We detect by checking if values look like nanoseconds (> 1e15) vs seconds (< 1e12).
    const cutoffUnix = Math.floor(Date.now() / 1000) - days * 86400;

    // Sample one row to detect epoch type
    const sample = db.prepare("SELECT date FROM message WHERE date IS NOT NULL LIMIT 1").get() as { date: number } | undefined;
    const isNano = sample && sample.date > 1e15;
    const cutoffApple = isNano
      ? (cutoffUnix - APPLE_EPOCH_OFFSET) * 1e9
      : (cutoffUnix - APPLE_EPOCH_OFFSET);

    const rows = db.prepare(`
      SELECT m.text, m.attributedBody, m.date, h.id AS sender
      FROM message m
      JOIN handle h ON m.handle_id = h.rowid
      WHERE m.is_from_me = 0
        AND (m.text IS NOT NULL OR m.attributedBody IS NOT NULL)
        AND m.date > ?
      ORDER BY m.date DESC
    `).all(cutoffApple) as Array<{ text: string | null; attributedBody: Buffer | null; date: number; sender: string }>;

    const transactions = [];
    for (const row of rows) {
      const text = extractText(row.text, row.attributedBody);
      if (!text?.trim()) continue;
      const senderLower = row.sender.toLowerCase();
      const matchesSender = senders.some(s => senderLower.includes(s) || s.includes(senderLower));
      if (!matchesSender) continue;

      const parsed = parseSms(text);
      if (!parsed) continue;

      const appleSeconds = isNano ? row.date / 1e9 : row.date;
      const unixMs = (appleSeconds + APPLE_EPOCH_OFFSET) * 1000;
      const date = new Date(unixMs).toISOString().split("T")[0];

      transactions.push({
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        date,
        source: "sms",
        raw: text.slice(0, 120),
      });
    }

    return NextResponse.json({ transactions, count: transactions.length });
  } finally {
    db.close();
  }
}
