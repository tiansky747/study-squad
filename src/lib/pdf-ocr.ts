export async function ocrPdfFromBuffer(
  buffer: ArrayBuffer,
  maxPages: number = 5,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.("正在加载PDF引擎...");
  const pdfjsLib = await loadPdfJs();

  onProgress?.("正在读取PDF文件...");
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);

  onProgress?.("正在加载OCR引擎...");
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("chi_sim", 1, {
    logger: (m: any) => {
      if (m.status === "loading tesseract core") onProgress?.("加载OCR核心...");
      else if (m.status === "initializing tesseract") onProgress?.("初始化OCR引擎...");
      else if (m.status === "loading language traineddata") onProgress?.("加载中文语言包(15MB)...");
      else if (m.status === "initializing api") onProgress?.("准备就绪...");
    },
  });

  const results: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress?.("正在处理第 " + i + "/" + totalPages + " 页...");
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await (page as any).render({ canvasContext: ctx, viewport: viewport as any }).promise;
    const { data } = await worker.recognize(canvas);
    results.push("--- 第 " + i + " 页 ---\n" + data.text);
  }
  await worker.terminate();
  return results.join("\n");
}

// Try multiple CDN URLs in order (jsdelivr works well in China, cloudflare is backup)
var PDF_CDNS = [
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js",
];

var WORKER_CDNS = [
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js",
];

async function loadPdfJs(): Promise<any> {
  var w = window as any;
  if (w.pdfjsLib) return w.pdfjsLib;

  // Try each CDN with a timeout
  for (var i = 0; i < PDF_CDNS.length; i++) {
    try {
      await loadScript(PDF_CDNS[i], 10000);
      w.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDNS[i];
      return w.pdfjsLib;
    } catch (e) {
      if (i < PDF_CDNS.length - 1) continue;
      throw new Error("PDF引擎加载失败，请检查网络连接。尝试刷新页面后重试。");
    }
  }
}

function loadScript(url: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    var s = document.createElement("script");
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      s.remove();
      reject(new Error("加载超时: " + url));
    }, timeoutMs);
    s.onload = function () {
      if (!timedOut) { clearTimeout(timer); resolve(); }
    };
    s.onerror = function () {
      if (!timedOut) { clearTimeout(timer); s.remove(); reject(new Error("加载失败: " + url)); }
    };
    s.src = url;
    document.head.appendChild(s);
  });
}