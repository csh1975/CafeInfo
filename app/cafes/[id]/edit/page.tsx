import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CafeForm from "@/components/cafe/CafeForm";

export default async function EditCafePage({ params }: { params: { id: string } }) {
  const cafe = await prisma.cafe.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, address: true, travelTime: true, rating: true, description: true, imageType: true, updatedAt: true },
  });
  if (!cafe) notFound();

  return (
    <div>
      <h1 className="mt-6 font-serif text-2xl font-bold text-coffee-900 md:text-3xl">카페 수정</h1>
      <p className="mt-1 text-sm text-stone-500">“{cafe.name}” 정보를 수정합니다. 이미지를 올리지 않으면 기존 이미지가 유지됩니다.</p>
      <CafeForm
        mode="edit"
        cafeId={cafe.id}
        existingImage={cafe.imageType != null}
        imageVersion={cafe.updatedAt.getTime()}
        defaultValues={{
          name: cafe.name,
          address: cafe.address,
          travelTime: cafe.travelTime,
          rating: cafe.rating,
          description: cafe.description ?? "",
        }}
      />
    </div>
  );
}
