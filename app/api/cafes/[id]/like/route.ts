import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// POST /api/cafes/[id]/like — 1인 1회 공감 (쿠키 기반 중복 차단)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const cookieName = `cafelog_liked_${params.id}`;
    if (req.cookies.get(cookieName)?.value === "1") {
      const current = await prisma.cafe.findUnique({
        where: { id: params.id },
        select: { likeCount: true },
      });
      if (!current) {
        return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json(
        { error: "이미 공감한 카페입니다.", likeCount: current.likeCount, liked: true },
        { status: 409 }
      );
    }
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
    const res = NextResponse.json({ likeCount: updated.likeCount, liked: true });
    res.cookies.set(cookieName, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
    return res;
  } catch (e) {
    console.error(`POST /api/cafes/${params.id}/like failed:`, e);
    return NextResponse.json({ error: "좋아요 처리에 실패했습니다." }, { status: 500 });
  }
}
