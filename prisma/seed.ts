import { hashPassword } from "@/lib/password";
import { PrismaClient, Prisma, Role } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "admin@gmail.com",
    password: hashPassword("12345"),
    role: Role.ADMIN, // ✅ use Role.ADMIN instead of "ADMIN"
  },
  {
    name: "Bob",
    email: "cashier@gmail.com",
    password: hashPassword("12345"),
    role: Role.CASHIER, // ✅ use Role.CASHIER instead of "CASHIER"
  },
];

async function main() {
  console.log("Seeding users...");
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
  console.log("Done seeding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
