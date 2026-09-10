import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.info("Skip seed: set ADMIN_EMAIL and ADMIN_PASSWORD");
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash: await hash(password, 12),
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
      profile: {
        create: { firstName: "House", lastName: "Admin" },
      },
      partnerPreferences: { create: {} },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
