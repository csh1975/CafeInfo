import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Stars, CafePlaceholder } from "@/components/ui/bits";
import { DeleteButton } from "@/components/cafe/DeleteButton";
import Comments from "@/components/cafe/Comments";

export default async function CafeDetailPage({ params }: { params: { id: string } }) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, address: true, travelTime: true, rating: true, description: true, imageType: true, createdAt: true, updatedAt: true },
  });
  if (!cafe) notFound();

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <Link href="/cafes" className="text-sm font-semibold text-point hover:underline">← 목록으로</Link>
      <article className="card mt-3 overflow-hidden">
        <div className="relative aspect-[16/9] bg-cream-100">
          {cafe.imageType ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/cafes/${cafe.id}/image?v=${cafe.updatedAt.getTime()}`} alt={cafe.name} className="h-full w-full object-cover" />
          ) : (
            <CafePlaceholder label="등록된 이미지가 없습니다" />
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-serif text-2xl font-bold text-coffee-900 md:text-3xl">{cafe.name}</h1>
            <Stars value={cafe.rating} size="lg" />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-bold text-coffee-700">주소</dt><dd className="flex flex-wrap items-center gap-2 text-stone-700"><span>{cafe.address}</span><a href={`https://map.naver.com/p/search/${encodeURIComponent(cafe.name)}?c=15.00,0,0,0,dh`} target="_blank" rel="noopener noreferrer" title="네이버지도에서 위치 찾기 (새 탭)" className="rounded-full border border-coffee-500/30 bg-white px-3 py-1 text-xs font-bold text-coffee-700 transition hover:bg-cream-100">📍 위치찾기</a></dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-bold text-coffee-700">이동 시간</dt><dd className="text-stone-700">🚗 자동차 {cafe.travelTime}분</dd></div>
            <div className="flex gap-2"><dt className="w-20 shrink-0 font-bold text-coffee-700">등록일</dt><dd className="text-stone-500">{cafe.createdAt.toLocaleDateString("ko-KR")}</dd></div>
          </dl>
          {cafe.description && (
            <div className="mt-5 rounded-xl bg-cream-50 p-4 text-sm leading-relaxed text-stone-700">{cafe.description}</div>
          )}
          <div className="mt-6 flex gap-2 border-t border-coffee-500/10 pt-5">
            <Link href={`/cafes/${cafe.id}/edit`} className="btn-primary !px-5 !py-2.5 text-xs">수정</Link>
            <DeleteButton id={cafe.id} name={cafe.name} />
          </div>
        </div>
      </article>
      <Comments cafeId={cafe.id} />
    </div>
  );
}
