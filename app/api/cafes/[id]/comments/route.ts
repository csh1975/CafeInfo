import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentCreateSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

type Params = { params: { id: string } };

// GET /api/cafes/[id]/comments — 댓글 목록 (오래된 순)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const cafe = await prisma.cafe.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!cafe) return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });

    const comments = await prisma.comment.findMany({
      where: { cafeId: params.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, nickname: true, content: true, createdAt: true },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    });
  } catch (e) {
    console.error(`GET /api/cafes/${params.id}/comments failed:`, e);
    return NextResponse.json({ error: "댓글을 불러오지 못했습니다." }, { status: 500 });
  }
}

// POST /api/cafes/[id]/comments — 익명 댓글 작성
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const cafe = await prisma.cafe.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!cafe) return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const parsed = commentCreateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const created = await prisma.comment.create({
      data: {
        cafeId: params.id,
        nickname: parsed.data.nickname ?? "익명",
        content: parsed.data.content,
        password: hashPassword(parsed.data.password),
      },
      select: { id: true, nickname: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      { comment: { ...created, createdAt: created.createdAt.toISOString() } },
      { status: 201 }
    );
  } catch (e) {
    console.error(`POST /api/cafes/${params.id}/comments failed:`, e);
    return NextResponse.json({ error: "댓글 작성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
