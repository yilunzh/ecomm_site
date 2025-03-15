import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
  }
} 