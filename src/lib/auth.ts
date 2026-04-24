import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Mock users for development
const MOCK_USERS = [
  { id: "mock-admin", email: "admin@usal.es", name: "María García López", role: "ADMIN" as const, image: null },
  { id: "mock-user", email: "investigador1@usal.es", name: "Ana Fernández Ruiz", role: "USER" as const, image: null },
  { id: "mock-superadmin", email: "superadmin@usal.es", name: "Carlos Rodríguez Martín", role: "SUPER_ADMIN" as const, image: null },
];

const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

// ─── Accounts with pre-assigned roles ───
const ROLE_MAP: Record<string, "SUPER_ADMIN" | "ADMIN"> = {
  "iuce.tecnico@usal.es": "SUPER_ADMIN",
  // Add more here as needed, e.g.:
  // "solmos@usal.es": "ADMIN",
};

function getDefaultRole(email: string): "USER" | "ADMIN" | "SUPER_ADMIN" {
  return ROLE_MAP[email.toLowerCase()] || "USER";
}

/** Convert email prefix to a readable name: "solmos" → "Solmos", "iuce.tecnico" → "Iuce Tecnico" */
function formatNameFromEmail(email: string): string {
  const prefix = email.split("@")[0];
  return prefix
    .replace(/[._-]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "IUCE",
      credentials: {
        email: { label: "Email", type: "email" },
        magicToken: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email?.endsWith("@usal.es")) return null;

        const magicToken = credentials?.magicToken as string | undefined;

        // ─── Magic Link verification ───
        if (magicToken) {
          try {
            const token = await prisma.verificationToken.findFirst({
              where: {
                identifier: email,
                token: magicToken,
                expires: { gt: new Date() },
              },
            });
            if (!token) return null;

            // Delete used token (one-time use)
            await prisma.verificationToken.delete({
              where: {
                identifier_token: { identifier: email, token: magicToken },
              },
            });

            // Determine role for known accounts
            const assignedRole = getDefaultRole(email);

            // Upsert user
            const user = await prisma.user.upsert({
              where: { email },
              update: {
                lastLogin: new Date(),
                ...(assignedRole !== "USER" && { role: assignedRole }),
              },
              create: { email, name: formatNameFromEmail(email), role: assignedRole },
            });

            if (user.isBanned) return null;

            return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
          } catch (error) {
            console.error("Magic link verification error:", error);
            return null;
          }
        }

        // ─── Mock login (dev only) ───
        if (useMockAuth) {
          const mockUser = MOCK_USERS.find((u) => u.email === email);
          if (mockUser) return mockUser;

          const user = await prisma.user.upsert({
            where: { email },
            update: {
              lastLogin: new Date(),
              ...(getDefaultRole(email) !== "USER" && { role: getDefaultRole(email) }),
            },
            create: { email, name: formatNameFromEmail(email), role: getDefaultRole(email) },
          });

          if (user.isBanned) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, department: true, isBanned: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
