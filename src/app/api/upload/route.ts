import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/lib/pdf-extract";

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
    try {
      content = extractPdfText(buffer);
      if (!content || content.length < 10) {
        content = "(PDF文件已上传，但未能提取出文字内容。可能是扫描版PDF，请使用TXT或MD格式。)";
      }
    } catch {
      content = "(PDF文件已上传，但文字提取失败。请尝试使用TXT或MD格式。)";
    }
  } else {
    content = buffer.toString("utf-8");
  }

  return NextResponse.json({
    name: file.name,
    size: buffer.length,
    content: content,
    preview: content.slice(0, 500),
  });
}
