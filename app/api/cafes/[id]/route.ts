import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cafeUpdateSchema, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/validations";

type Params = { params: { id: string } };

function toItem(cafe: {
  id: string;
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  description: string | null;
  imageType: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...cafe,
    hasImage: cafe.imageType != null,
    createdAt: cafe.createdAt.toISOString(),
    updatedAt: cafe.updatedAt.toISOString(),
  };
}

// GET /api/cafes/[id] — 이미지 바이너리 제외
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, address: true, travelTime: true, rating: true, description: true, imageType: true, createdAt: true, updatedAt: true },
    });
    if (!cafe) return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ cafe: toItem(cafe) });
  } catch (e) {
    console.error(`GET /api/cafes/${params.id} failed:`, e);
    return NextResponse.json({ error: "카페 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}

// PUT /api/cafes/[id] — multipart/form-data, 이미지 미전송 시 기존 유지
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const exists = await prisma.cafe.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });

    const form = await req.formData();
    const parsed = cafeUpdateSchema.safeParse({
      name: form.get("name"),
      address: form.get("address"),
      travelTime: form.get("travelTime"),
      rating: form.get("rating"),
      description: (form.get("description") as string | null) ?? undefined,
    });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "이미지는 JPEG, PNG, WebP 형식만 업로드할 수 있습니다." }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "이미지 크기는 1MB 이하이어야 합니다." }, { status: 400 });
      }
      data.image = new Uint8Array(await file.arrayBuffer());
      data.imageType = file.type;
    }
    // 이미지 필드가 비어 있으면 기존 BLOB 유지 (removeImage=true 일 때만 삭제)
    if (form.get("removeImage") === "true") {
      data.image = null;
      data.imageType = null;
    }

    const updated = await prisma.cafe.update({
      where: { id: params.id },
      data: data as never,
      select: { id: true, name: true, address: true, travelTime: true, rating: true, description: true, imageType: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ cafe: toItem(updated) });
  } catch (e) {
    console.error(`PUT /api/cafes/${params.id} failed:`, e);
    return NextResponse.json({ error: "카페 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/cafes/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const exists = await prisma.cafe.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });
    await prisma.cafe.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`DELETE /api/cafes/${params.id} failed:`, e);
    return NextResponse.json({ error: "카페 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
