import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.name) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["txt", "md", "pdf"].includes(ext)) {
    return NextResponse.json({ error: "仅支持 .txt .md .pdf 格式" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  let content = "";
  if (ext === "pdf") {
    content = "(PDF文件已上传。对于文字版PDF可使用pdf-parse库提取，扫描版PDF需OCR识别。)";
  } else {
    content = buffer.toString("utf-8");
  }
  return NextResponse.json({ name: file.name, size: buffer.length, preview: content.slice(0, 500) });
}
