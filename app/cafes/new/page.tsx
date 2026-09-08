import CafeForm from "@/components/cafe/CafeForm";

export default function NewCafePage() {
  return (
    <div>
      <h1 className="mt-6 font-serif text-2xl font-bold text-coffee-900 md:text-3xl">새 카페 등록</h1>
      <p className="mt-1 text-sm text-stone-500">다녀온 카페를 기록해주세요. 이미지는 자동으로 압축됩니다.</p>
      <CafeForm mode="create" />
    </div>
  );
}
