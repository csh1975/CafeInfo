import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

function getClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    const libsql = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql as never) });
  }
  return new PrismaClient({ datasources: { db: { url } } });
}

const prisma = getClient();

async function main() {
  const count = await prisma.cafe.count();
  if (count > 0) {
    console.log(`시드 건너뜀: 이미 ${count}개의 카페가 있습니다.`);
    return;
  }
  await prisma.cafe.createMany({
    data: [
      { name: "슬로우커피 하우스", address: "서울시 마포구 연남로 12", travelTime: 8, rating: 5, description: "창가 자리가 조용하고 콘센트가 많아요." },
      { name: "베이지앤브라운", address: "서울시 성동구 아차산로 45", travelTime: 15, rating: 4, description: "디저트가 맛있는 웜톤 카페." },
      { name: "딥그린 에스프레소", address: "서울시 종로구 북촌로 7", travelTime: 20, rating: 4, description: "플랫화이트가 시그니처." },
      { name: "테라코타 브루잉", address: "서울시 동작구 노량진로 30", travelTime: 5, rating: 3, description: "가성비 좋은 동네 카페." },
    ],
  });
  console.log("시드 완료: 예시 카페 4개 등록 (이미지 없음)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
