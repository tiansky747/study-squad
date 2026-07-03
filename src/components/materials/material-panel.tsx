"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, FileText, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Material {
  name: string;
  size: number;
  source: "upload" | "library";
  preview?: string;
}

interface Props {
  selectedMaterial: string | null;
  onSelectMaterial: (content: string | null) => void;
}

export default function MaterialPanel({ selectedMaterial, onSelectMaterial }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [localUploads, setLocalUploads] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<"all" | "library" | "upload">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data);
    } catch {
      setMaterials([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadMaterials(); }, []);

    const handleUpload = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setOcrProgress("正在读取PDF...");
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) { alert("文件读取失败"); setOcrProgress(""); return; }
        try {
          const { ocrPdfFromBuffer } = await import("@/lib/pdf-ocr");
          setOcrProgress("正在加载OCR引擎(首次需要下载15MB中文语言包)...");
          const text = await ocrPdfFromBuffer(buffer, 30, (msg) => {
            setOcrProgress(msg);
          });
          setOcrProgress("");
          if (text && text.length > 10) {
            onSelectMaterial(text);
            setPreview(text.slice(0, 300));
            setShowPreview(true);
            setCurrentTab("upload");
            setLocalUploads(prev => [{ name: file.name, size: text.length, source: "upload", preview: text }, ...prev]);
          } else {
            alert("未能从PDF中识别出文字，可能是扫描质量较差。");
          }
        } catch (err: any) {
          setOcrProgress("");
          alert(`PDF识别失败: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    // TXT/MD files: read directly as text
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string || "";
      const name = file.name;
      if (content) {
        onSelectMaterial(content);
        setPreview(content.slice(0, 300));
        setShowPreview(true);
        setCurrentTab("upload");
        setLocalUploads(prev => [{ name, size: content.length, source: "upload", preview: content }, ...prev]);
      }
      const btn = document.querySelector("[data-upload-btn]");
      if (btn) (btn as HTMLElement).innerText = "✓ 已上传";
      setTimeout(() => {
        if (btn) (btn as HTMLElement).innerHTML = '<svg class="lucide lucide-upload" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> 上传';
      }, 2000);
    };
    reader.onerror = () => { alert("文件读取失败"); };
    reader.readAsText(file);
  };

  const handleSelectMaterial = async (name: string, source: string) => {
    // Check local uploads first
    const local = localUploads.find(u => u.name === name && u.source === source);
    if (local && local.preview) {
      onSelectMaterial(local.preview);
      setPreview(local.preview.slice(0, 300));
      setShowPreview(true);
      return;
    }
    try {
      const res = await fetch(`/api/materials?name=${encodeURIComponent(name)}&source=${source}`);
      const data = await res.json();
      if (data.content) {
        onSelectMaterial(data.content);
        setPreview(data.preview || data.content.substring(0, 300));
        setShowPreview(true);
      }
    } catch {
      onSelectMaterial(name);
    }
  };

  const displayed = [...localUploads, ...materials];
  const filtered = currentTab === "all"
    ? displayed
    : displayed.filter((m) => m.source === currentTab);

  const tabs = [
    { id: "all" as const, label: "全部" },
    { id: "library" as const, label: "推荐" },
    { id: "upload" as const, label: "上传" },
  ];

  return (
    <aside className="hidden lg:flex w-72 bg-white border-l shrink-0 flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-1">
          <BookOpen size={14} /> 学习资料
        </span>
        <Button
          size="sm"
          variant="outline"
          data-upload-btn
          className="text-xs h-7 px-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Upload size={12} className="mr-1" />}
          {uploading ? "上传中..." : "上传"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              currentTab === tab.id
                ? "bg-[#667eea] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Material list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-300" size={20} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">暂无资料</p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.name + m.source}
              onClick={() => handleSelectMaterial(m.name, m.source)}
              className={cn(
                "w-full text-left p-2 rounded-lg text-xs transition-colors border",
                selectedMaterial?.includes(m.name)
                  ? "border-[#667eea] bg-[#f0ebff]"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-gray-400 shrink-0" />
                <span className="truncate font-medium">{m.name}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 pl-5">
                {m.source === "library" ? "📖 推荐" : "📁 上传"}
                {" · "}
                {(m.size / 1024).toFixed(1)}KB
              </div>
            </button>
          ))
        )}
      </div>

      {/* Preview */}
            {/* OCR Progress */}
      {ocrProgress && (
        <div className="border-t p-3">
          <div className="flex items-center gap-2 text-xs text-[#667eea]">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
            <span>{ocrProgress}</span>
          </div>
        </div>
      )}

{showPreview && preview && (
        <div className="border-t p-3 max-h-40 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#667eea] mb-1">当前学习内容预览</p>
          <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">
            {preview.substring(0, 300)}...
          </p>
        </div>
      )}
    </aside>
  );
}
