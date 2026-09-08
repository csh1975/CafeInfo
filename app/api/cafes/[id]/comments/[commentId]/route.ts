import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentDeleteSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

type Params = { params: { id: string; commentId: string } };

// DELETE /api/cafes/[id]/comments/[commentId] — 비밀번호 확인 후 삭제
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = commentDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
    }

    const comment = await prisma.comment.findFirst({
      where: { id: params.commentId, cafeId: params.id },
      select: { id: true, password: true },
    });
    if (!comment) return NextResponse.json({ error: "리뷰를 찾을 수 없습니다." }, { status: 404 });
    if (comment.password !== hashPassword(parsed.data.password)) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`DELETE /api/cafes/${params.id}/comments/${params.commentId} failed:`, e);
    return NextResponse.json({ error: "리뷰 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
