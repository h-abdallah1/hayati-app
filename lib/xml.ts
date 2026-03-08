/** Normalise a value that might be a plain string, a CDATA object, or a {#text} object */
export function extractText(val: unknown): string {
  if (!val && val !== 0) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    return String(o["__cdata"] ?? o["#text"] ?? "");
  }
  return String(val);
}
