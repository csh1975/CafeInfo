import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// POST /api/cafes/[id]/like — 공감 +1 (무제한 증가)
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const exists = await prisma.cafe.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });
    }
    const updated = await prisma.cafe.update({
      where: { id: params.id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    return NextResponse.json({ likeCount: updated.likeCount });
  } catch (e) {
    console.error(`POST /api/cafes/${params.id}/like failed:`, e);
    return NextResponse.json({ error: "좋아요 처리에 실패했습니다." }, { status: 500 });
  }
}
