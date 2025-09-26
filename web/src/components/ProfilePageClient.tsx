"use client";

import { useState } from "react";
import { ProfileForm } from "./ProfileForm";
import { PassionManager } from "./PassionManager";

interface User {
  name?: string;
  location?: string;
  privacy?: string;
}

interface Passion {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UserPassion {
  id: string;
  passion: Passion;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  passion?: Passion;
  createdAt: string;
  updatedAt: string;
}

interface ProfilePageClientProps {
  user: User | null;
  initialUserPassions: UserPassion[];
  projects: Project[];
}

export function ProfilePageClient({ user, initialUserPassions, projects }: ProfilePageClientProps) {
  const [userPassions, setUserPassions] = useState<UserPassion[]>(initialUserPassions);

  const handlePassionAdded = (newPassion: UserPassion) => {
    setUserPassions(prev => [...prev, newPassion]);
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Your profile</h1>

      {(!user?.name || !user?.location) ? (
        <ProfileForm
          initialName={user?.name ?? ""}
          initialLocation={user?.location ?? ""}
          initialPrivacy={(user?.privacy as "private" | "friends" | "public") ?? "public"}
        />
      ) : null}

      <PassionManager
        userPassions={userPassions}
        onPassionAdded={handlePassionAdded}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white mb-3">Your projects</h2>
        {projects.length === 0 ? (
          <div className="text-white/70">No projects yet. Create one from onboarding or the Projects page.</div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="bg-white/10 rounded-md p-4 text-white">
                <a href={`/projects/${project.id}`} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{project.title}</div>
                      {project.description && (
                        <div className="text-sm text-white/70 mt-1">{project.description}</div>
                      )}
                      <div className="text-xs text-white/60 mt-2">Passion: {project.passion?.name ?? "—"}</div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}