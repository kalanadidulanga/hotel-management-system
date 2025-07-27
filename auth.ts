import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./lib/zod";
import { hashPassword, verifyPassword } from "./lib/password";
import prisma from "./lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(
            credentials
          );

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          });

          if (!user) {
            throw new Error("Invalid credentials.");
          }

          const isValid = verifyPassword(password, user.password);
          if (!isValid) {
            throw new Error("Invalid credentials.");
          }

          // Convert id to string to match NextAuth's User type
          return {
            id: user.id.toString(), // Convert number to string
            email: user.email,
            name: user.name || null, // Ensure name is string | null
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id; // Ensure user.id is a string from authorize
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && typeof token.id === "string") {
        session.user.id = token.id; // Assign token.id as a string
      }
      return session;
    },
  },
});
