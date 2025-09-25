import { DefaultSession } from "next-auth";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth-config";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      privacy?: string | null;
    };
  }
}

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}


