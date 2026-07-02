/**
 * Extract text from a PDF buffer using pure JavaScript (no external deps).
 * Works for text-based PDFs. Scanned/image PDFs will return no content.
 */
import zlib from "zlib";

export function extractPdfText(buffer: Buffer): string {
  const texts: string[] = [];
  const str = buffer.toString("binary");

  // Find all stream objects
  const streamRegex = /stream\s(.+?)\s*endstream/gs;
  let match;

  while ((match = streamRegex.exec(str)) !== null) {
    const raw = match[1];
    if (!raw || raw.length < 10) continue;

    // Try to get the raw bytes for this stream
    const startOffset = match.index + "stream ".length;
    const endOffset = startOffset + raw.length;
    const rawBytes = buffer.subarray(startOffset, endOffset);

    let decompressed: Buffer | null = null;

    // Try FlateDecode (zlib) decompression
    try {
      decompressed = zlib.inflateSync(rawBytes);
    } catch {
      // Not compressed or not FlateDecode - try as-is
      decompressed = rawBytes;
    }

    if (!decompressed || decompressed.length < 10) continue;

    // Extract text from PDF text operators
    const decStr = decompressed.toString("utf-8");
    const btMatches = decStr.matchAll(/BT(.*?)ET/gs);

    for (const bt of btMatches) {
      const block = bt[1];

      // Tj operator: (text) Tj
      const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
      for (const t of tjMatches) {
        texts.push(t[1].replace(/\\([()\\])/g, "$1"));
      }

      // TJ operator: [(text) num (text) num] TJ
      const tjArrMatches = block.matchAll(/\[(.*?)\]\s*TJ/g);
      for (const arr of tjArrMatches) {
        const parts: string[] = [];
        const parenMatches = arr[1].matchAll(/\(([^)]*)\)/g);
        for (const p of parenMatches) {
          parts.push(p[1].replace(/\\([()\\])/g, "$1"));
        }
        if (parts.length > 0) texts.push(parts.join(""));
      }
    }
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
