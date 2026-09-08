import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/cafes/[id]/image — BLOB 스트리밍 + Cache-Control
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { id: params.id },
      select: { image: true, imageType: true, updatedAt: true },
    });
    if (!cafe?.image || !cafe.imageType) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 404 });
    }

    const bytes = cafe.image as Uint8Array;
    const blob = new Blob([bytes as unknown as BlobPart], { type: cafe.imageType });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": cafe.imageType,
        "Content-Length": String(bytes.byteLength ?? bytes.length),
        // 1시간 캐시 + stale-while-revalidate (상세/목록 썸네일 재조회 절감)
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        ETag: `"cafe-${params.id}-${cafe.updatedAt.getTime()}"`,
      },
    });
  } catch (e) {
    console.error(`GET /api/cafes/${params.id}/image failed:`, e);
    return NextResponse.json({ error: "이미지를 불러오지 못했습니다." }, { status: 500 });
  }
}
