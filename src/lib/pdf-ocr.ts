/**
 * Browser-side OCR for PDF files.
 * Uses PDF.js to render pages + Tesseract.js to recognize Chinese text.
 * Both libraries run entirely in the browser.
 */

export async function ocrPdfFromBuffer(
  buffer: ArrayBuffer,
  maxPages: number = 5,
  onProgress?: (msg: string) => void
): Promise<string> {
  // Dynamically import heavy libraries
  onProgress?.("正在加载PDF解析引擎...");
  const pdfjsLib = await import("pdfjs-dist");
  // Set worker from CDN
  const version = (pdfjsLib as any).version;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    '/pdf.worker.min.mjs';

  onProgress?.("正在读取PDF文件...");
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const results: string[] = [];

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

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`正在处理第 ${i}/${totalPages} 页...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // 2x for better accuracy
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx as any, viewport } as any).promise;

    const { data } = await worker.recognize(canvas);
    results.push(`--- 第 ${i} 页 ---\n${data.text}`);
  }

  await worker.terminate();
  return results.join("\n\n");
}
