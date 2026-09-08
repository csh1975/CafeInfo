import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  // Turso(libSQL) URL인 경우 어댑터 경유, 로컬 file: 인 경우 기본 클라이언트
  // (스키마의 env("DATABASE_URL")이 file: 경로를 처리하므로 datasources 옵션 불필요)
  // NOTE: eval("require") 동적 로딩을 쓰면 프로덕션 번들(Vercel 서버리스)에서
  // import 시점에 throw가 발생해 API가 HTML 500을 반환한다. 정적 import +
  // next.config의 serverComponentsExternalPackages로 해결한다.
  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const adapter = new PrismaLibSQL({ url, authToken });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
