/**
 * 클라이언트 이미지 리사이즈/압축 유틸
 * - 최대 가로/세로 1200px, JPEG quality 0.8, 최종 1MB 상한 강제
 * - 외부 라이브러리 없이 Canvas API만 사용 (스택 추가 금지 준수)
 */

export const MAX_EDGE = 1200;
export const JPEG_QUALITY = 0.8;
export const MAX_OUTPUT_SIZE = 1 * 1024 * 1024; // 1MB

export async function processImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  const url = bitmap ? null : URL.createObjectURL(file);

  try {
    const img = bitmap
      ? await bitmapToImage(bitmap)
      : await loadImage(url as string);

    const { width, height } = fitWithin(img.naturalWidth ?? img.width, img.naturalHeight ?? img.height, MAX_EDGE);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 처리를 지원하지 않는 브라우저입니다.");
    ctx.drawImage(img as CanvasImageSource, 0, 0, canvas.width, canvas.height);

    // 1차: JPEG 0.8로 변환
    let blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    // 여전히 1MB 초과 시 quality를 단계적으로 낮춤
    let quality = JPEG_QUALITY;
    while (blob && blob.size > MAX_OUTPUT_SIZE && quality > 0.4) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (!blob) throw new Error("이미지 압축에 실패했습니다.");
    if (blob.size > MAX_OUTPUT_SIZE) {
      throw new Error("이미지 크기가 1MB를 초과합니다. 다른 이미지를 선택해주세요.");
    }

    const base = (file.name || "cafe").replace(/\.[a-zA-Z0-9]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    if (url) URL.revokeObjectURL(url);
    bitmap?.close?.();
  }
}

function fitWithin(w: number, h: number, maxEdge: number): { width: number; height: number } {
  if (w <= maxEdge && h <= maxEdge) return { width: w, height: h };
  const ratio = Math.min(maxEdge / w, maxEdge / h);
  return { width: w * ratio, height: h * ratio };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = url;
  });
}

async function bitmapToImage(bitmap: ImageBitmap): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  const url = canvas.toDataURL();
  return loadImage(url);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
