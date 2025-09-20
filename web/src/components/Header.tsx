"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <header className="px-4 py-3 flex items-center justify-between border-b border-accent-300 bg-accent-400 shadow-soft">
      <Link href="/" className="font-bold text-lg text-white hover:text-secondary-400 transition-colors">
        pathos
      </Link>
      
      {/* Navigation for authenticated users */}
      {isAuthed && (
        <nav className="flex items-center gap-4">
          <Link href="/projects" className="text-sm font-medium text-white hover:text-secondary-400 transition-colors">
            Projects
          </Link>
          <Link href="/profile" className="text-sm font-medium text-white hover:text-secondary-400 transition-colors">
            Profile
          </Link>
        </nav>
      )}

      <div className="flex items-center gap-3">
        {isAuthed ? (
          <>
            <span className="text-sm text-white">
              {session?.user?.name ?? session?.user?.username ?? "Signed in"}
            </span>
            <button 
              className="rounded-lg border border-white px-3 py-1 text-white hover:bg-white hover:text-accent-600 transition-colors text-sm font-medium" 
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link 
            href="/auth" 
            className="rounded-lg border border-primary-600 bg-primary-600 text-white px-3 py-1 hover:bg-primary-700 hover:border-primary-700 transition-colors text-sm font-medium"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}


