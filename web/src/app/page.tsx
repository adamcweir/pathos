"use client";

import Link from "next/link";
import FeedPreview from "@/components/FeedPreview";
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
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-800/10 to-primary-900/20"></div>

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Welcome to{" "}
              <span className="inline-block rounded-md bg-yellow-400 px-3 py-3 text-black">
                pathos
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-100 mb-4 max-w-3xl mx-auto leading-relaxed">
              Where personal passions come alive through shared journeys
            </p>

            {/* Enhanced Get Started Button */}
            <div className="mb-16">
              <Link
                href="/auth"
                className="group relative inline-flex items-center gap-2 bg-white text-black font-bold py-4 px-10 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl text-lg hover:bg-secondary-500"
              >
                <span className="relative z-10">Get Curious</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Preview */}
      <FeedPreview />
    </main>
  );
}
