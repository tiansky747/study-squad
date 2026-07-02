// Diary is handled entirely on the frontend via localStorage.
// This API route exists for backward compatibility.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ content: "# 学习日记\n\n使用浏览器本地存储保存。\n学习后点击「记录进度」即可保存到本机。" });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
