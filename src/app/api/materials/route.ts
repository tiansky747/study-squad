import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const source = searchParams.get("source") || "library";

  // If name provided, return file content
  if (name) {
    const filePath = path.join(DATA_DIR, name);
    try {
      const content = readFileSync(filePath, "utf-8");
      return NextResponse.json({ name, content, preview: content.slice(0, 500) });
    } catch {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
  }

  // List materials
  const materials: any[] = [];
  if (existsSync(DATA_DIR)) {
    for (const f of readdirSync(DATA_DIR)) {
      if (f.endsWith(".txt") || f.endsWith(".md")) {
        const st = statSync(path.join(DATA_DIR, f));
        materials.push({ name: f, size: st.size, source: "library" });
      }
    }
  }
  return NextResponse.json(materials);
}
