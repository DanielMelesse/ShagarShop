import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      email: string | null;
      name: string;
    };
  }
  interface User {
    id: string;
    phone: string;
    email: string | null;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    email: string | null;
    name: string;
  }
}
