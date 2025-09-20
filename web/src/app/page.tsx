"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700">Loading...</p>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-800 mb-4">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="text-lg text-primary-600">
            Ready to track your progress and share your journey?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Link href="/projects" className="group">
            <div className="p-6 bg-white rounded-lg border-2 border-neutral-200 hover:border-accent-400 transition-colors shadow-soft hover:shadow-medium">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h2 className="text-xl font-semibold text-primary-800 group-hover:text-accent-600">
                  My Projects
                </h2>
              </div>
              <p className="text-primary-600">
                View and manage your active projects, track progress, and celebrate milestones.
              </p>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="p-6 bg-white rounded-lg border-2 border-neutral-200 hover:border-accent-400 transition-colors shadow-soft hover:shadow-medium">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-primary-800 group-hover:text-accent-600">
                  Profile
                </h2>
              </div>
              <p className="text-primary-600">
                Update your profile, manage your passions, and customize your settings.
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-br from-secondary-50 to-accent-50 rounded-lg p-6 border border-secondary-200">
            <h3 className="text-lg font-semibold text-primary-800 mb-2">
              Track Your Progress
            </h3>
            <p className="text-primary-600">
              Pathos helps you document your learning journey, connect with others who share your passions,
              and stay motivated through community support.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Welcome to <span className="text-secondary-400">pathos</span>
        </h1>
        <p className="text-xl text-neutral-100 mb-8">
          Social, for personal passions and pursuits. Relish and suffer in it together.
        </p>

        <div className="mb-12">
          <Link
            href="/auth"
            className="inline-block bg-secondary-400 text-primary-800 font-semibold py-3 px-8 rounded-lg hover:bg-secondary-500 transition-colors text-lg shadow-medium hover:shadow-large"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Go Streaking</h3>
          </div>

          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Build your project-based life</h3>
          </div>

          <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Commiserate</h3>
          </div>
        </div>
      </div>
    </main>
  );
}
