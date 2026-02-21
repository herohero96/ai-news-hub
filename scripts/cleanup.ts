/**
 * cleanup.ts
 * 清理旧资讯，只保留最近30天
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.article.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  console.log(`🗑️ 删除30天前旧资讯: ${result.count} 篇`);

  const total = await prisma.article.count();
  console.log(`📦 当前数据库共: ${total} 篇`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
