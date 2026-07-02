"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface DiaryEntry {
  date: string;
  topic: string;
  note: string;
  charName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// Simple markdown to HTML
function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)/gm, "<h3 style='margin:12px 0 4px;color:#333;font-size:14px'>$1</h3>")
    .replace(/^## (.+)/gm, "<h2 style='margin:16px 0 6px;color:#667eea;font-size:15px'>$1</h2>")
    .replace(/^# (.+)/gm, "<h1 style='margin:12px 0 8px;color:#333;font-size:17px'>$1</h1>")
    .replace(/- \[x\] (.+)/g, "✅ $1")
    .replace(/- \[ \] (.+)/g, "⬜ $1")
    .replace(/- (.+)/g, "• $1")
    .replace(/\n---\n/g, "<hr style='border:none;border-top:2px solid #e8e8e8;margin:12px 0'>")
    .replace(/\n/g, "<br>");
}

export function saveDiaryEntry(entry: DiaryEntry) {
  const existing = JSON.parse(localStorage.getItem("study-diary") || "[]");
  existing.unshift(entry);
  localStorage.setItem("study-diary", JSON.stringify(existing));
}

function loadDiaryText(): string {
  const entries: DiaryEntry[] = JSON.parse(localStorage.getItem("study-diary") || "[]");
  if (entries.length === 0) return "# 学习日记\n\n还没有学习记录";
  let md = "# 学习日记\n\n";
  for (const e of entries) {
    md += `## ${e.date}\n`;
    md += `**${e.charName}** 学习了「${e.topic}」\n\n`;
    md += `${e.note}\n\n---\n\n`;
  }
  return md;
}

export default function DiaryDialog({ open, onClose }: Props) {
  const [diaryContent, setDiaryContent] = useState("");

  useEffect(() => {
    if (open) {
      setDiaryContent(loadDiaryText());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📘 学习日记</DialogTitle>
          <DialogClose><X size={18} /></DialogClose>
        </DialogHeader>
        {!diaryContent ? (
          <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
        ) : (
          <div
            className="text-sm leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: mdToHtml(diaryContent) }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
