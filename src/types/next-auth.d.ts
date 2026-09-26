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
      /** True when buyer finished/skipped shop-home onboarding (non-buyers always true). */
      buyerOnboardingDone: boolean;
    };
  }
  interface User {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: UserRole;
    buyerOnboardingDone?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: UserRole;
    buyerOnboardingDone?: boolean;
  }
}
