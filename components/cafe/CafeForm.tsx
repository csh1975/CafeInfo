"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cafeBaseSchema } from "@/lib/validations";
import { processImageFile } from "@/lib/image";
import { RatingPicker } from "./RatingPicker";

export type CafeFormValues = {
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  description?: string;
};

export default function CafeForm({
  mode,
  cafeId,
  defaultValues,
  existingImage,
  imageVersion,
}: {
  mode: "create" | "edit";
  cafeId?: string;
  defaultValues?: Partial<CafeFormValues>;
  existingImage?: boolean;
  imageVersion?: number;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(
    mode === "edit" && existingImage && cafeId
      ? `/api/cafes/${cafeId}/image${imageVersion ? `?v=${imageVersion}` : ""}`
      : null
  );
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CafeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cafeBaseSchema as any),
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      travelTime: defaultValues?.travelTime ?? 10,
      rating: defaultValues?.rating ?? 5,
      description: defaultValues?.description ?? "",
    },
  });
  const rating = watch("rating");

  // 기존 이미지 깨짐 대비: 404면 미리보기 제거
  useEffect(() => {
    if (!preview || file) return;
    fetch(preview, { method: "HEAD" }).catch(() => setPreview(null));
  }, [preview, file]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) return;
    try {
      const processed = await processImageFile(f);
      setFile(processed);
      setRemoveImage(false);
      setPreview(URL.createObjectURL(processed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 처리에 실패했습니다.");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(values: CafeFormValues) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", values.name);
      form.set("address", values.address);
      form.set("travelTime", String(values.travelTime));
      form.set("rating", String(values.rating));
      form.set("description", values.description ?? "");
      if (file) form.set("image", file);
      if (mode === "edit" && removeImage) form.set("removeImage", "true");

      const url = mode === "create" ? "/api/cafes" : `/api/cafes/${cafeId}`;
      const res = await fetch(url, { method: mode === "create" ? "POST" : "PUT", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "저장에 실패했습니다.");

      const toast = mode === "create" ? "카페가 등록되었습니다." : "카페가 수정되었습니다.";
      router.push(`/cafes?toast=${encodeURIComponent(toast)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card mx-auto mt-6 max-w-2xl space-y-5 p-6 md:p-8">
      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}

      <div>
        <label className="label" htmlFor="name">카페명 *</label>
        <input id="name" className="input" placeholder="예: 슬로우커피 하우스" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="address">주소 *</label>
        <input id="address" className="input" placeholder="예: 서울시 마포구 연남로 12" {...register("address")} />
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="travelTime">자동차 소요시간(분) *</label>
          <input id="travelTime" type="number" min={0} max={1440} className="input" {...register("travelTime", { valueAsNumber: true })} />
          {errors.travelTime && <p className="mt-1 text-xs text-red-600">{errors.travelTime.message}</p>}
        </div>
        <div>
          <span className="label">추천도 *</span>
          <RatingPicker value={rating ?? 0} onChange={(v) => setValue("rating", v, { shouldValidate: true })} />
          {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
        </div>
      </div>

      <div>
        <span className="label">이미지 (선택, 1장 · 자동 압축, 1MB 이하)</span>
        <div className="flex flex-col gap-3">
          <div className="relative h-48 overflow-hidden rounded-xl border border-coffee-500/15 bg-cream-100">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="미리보기" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-coffee-500">
                <span className="text-3xl">🖼️</span>
                <span className="mt-1 text-xs font-semibold">선택된 이미지가 없습니다</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="btn-secondary relative cursor-pointer overflow-hidden !px-4 !py-2 text-xs">
              이미지 선택
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={onPick} />
            </span>
            {(preview || file) && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setRemoveImage(true);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="rounded-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                이미지 제거
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500">선택 즉시 리사이즈(최대 1200px) · JPEG 압축 후 미리보기가 표시됩니다.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">메모 / 추천 이유 (선택)</label>
        <textarea id="description" rows={4} className="input resize-none" placeholder="예: 창가 자리가 조용하고 콘센트가 많아요." {...register("description")} />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {busy ? "저장 중..." : mode === "create" ? "등록하기" : "수정하기"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          취소
        </button>
      </div>
    </form>
  );
}
