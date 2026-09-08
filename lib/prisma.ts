import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Turso(libSQL) URL인 경우 어댑터 경유 (webpack 정적 번들링 회피를 위해 eval-require 사용),
  // 로컬 file: 인 경우 기본 클라이언트
  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = eval("require")("@libsql/client") as typeof import("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = eval("require")("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const libsql = createClient({ url, authToken });
    const adapter = new PrismaLibSQL(libsql as never);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient({ datasources: { db: { url } } });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
