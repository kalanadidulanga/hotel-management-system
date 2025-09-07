// import { PrismaClient } from "../lib/generated/prisma";

// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient;
// };

// const prisma = globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// export default prisma;


// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Extend the global object to include prisma
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;