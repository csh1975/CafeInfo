import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cafeCreateSchema, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/validations";

function toListItem(cafe: {
  id: string;
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  description: string | null;
  imageType: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { comments: number };
}) {
  const { _count, ...rest } = cafe;
  return {
    ...rest,
    hasImage: cafe.imageType != null,
    reviewCount: _count?.comments ?? 0,
    createdAt: cafe.createdAt.toISOString(),
    updatedAt: cafe.updatedAt.toISOString(),
  };
}

// GET /api/cafes?q=&sort=rating|latest|distance|reviews&page=&pageSize= — 이미지 바이너리 제외
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const rawSort = searchParams.get("sort");
    const sort = rawSort === "latest" || rawSort === "distance" || rawSort === "reviews" ? rawSort : "rating";

    const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const parsedPageSize = Number.parseInt(searchParams.get("pageSize") ?? "9", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(parsedPageSize, 100)
        : 9;

    const where = q
      ? { OR: [{ name: { contains: q } }, { address: { contains: q } }] }
      : undefined;
    const orderBy =
      sort === "latest"
        ? { createdAt: "desc" as const }
        : sort === "distance"
          ? [{ travelTime: "asc" as const }, { createdAt: "desc" as const }]
          : sort === "reviews"
            ? [{ comments: { _count: "desc" as const } }, { createdAt: "desc" as const }]
            : [{ rating: "desc" as const }, { createdAt: "desc" as const }];

    const [total, cafes] = await prisma.$transaction([
      prisma.cafe.count({ where }),
      prisma.cafe.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          address: true,
          travelTime: true,
          rating: true,
          description: true,
          imageType: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { comments: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      cafes: cafes.map(toListItem),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (e) {
    console.error("GET /api/cafes failed:", e);
    return NextResponse.json({ error: "카페 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

// POST /api/cafes — multipart/form-data (텍스트 + 이미지 1장)
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const parsed = cafeCreateSchema.safeParse({
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

    const duplicate = await prisma.cafe.findFirst({
      where: { name: parsed.data.name },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "이미 등록된 카페명입니다. 다른 이름을 입력해주세요.", field: "name" },
        { status: 409 }
      );
    }

    let image: Uint8Array<ArrayBuffer> | undefined;
    let imageType: string | undefined;
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "이미지는 JPEG, PNG, WebP 형식만 업로드할 수 있습니다." }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "이미지 크기는 1MB 이하이어야 합니다." }, { status: 400 });
      }
      image = new Uint8Array(await file.arrayBuffer());
      imageType = file.type;
    }

    const created = await prisma.cafe.create({
      data: { ...parsed.data, image, imageType },
      select: { id: true, name: true, address: true, travelTime: true, rating: true, description: true, imageType: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ cafe: toListItem(created) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/cafes failed:", e);
    return NextResponse.json({ error: "카페 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
