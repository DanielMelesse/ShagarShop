import type { UserRole } from "@/lib/user-role";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      email: string | null;
      name: string;
      role: UserRole;
    };
  }
  interface User {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: UserRole;
  }
}
