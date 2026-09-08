import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") ?? "").trim();
    const excludeId = (searchParams.get("excludeId") ?? "").trim();

    if (!name) {
      return NextResponse.json({ exists: false });
    }

    const duplicate = await prisma.cafe.findFirst({
      where: excludeId
        ? { name, id: { not: excludeId } }
        : { name },
      select: { id: true },
    });

    return NextResponse.json({ exists: duplicate != null });
  } catch (e) {
    console.error("GET /api/cafes/check failed:", e);
    return NextResponse.json({ error: "중복 확인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
