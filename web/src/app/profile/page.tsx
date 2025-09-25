import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, location: true, privacy: true },
  });

  const [userPassions, projects] = await Promise.all([
    prisma.userPassion.findMany({
      where: { userId: session.user.id },
      include: { passion: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: { passion: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white mb-3">Your hobbies</h2>
        {userPassions.length === 0 ? (
          <div className="text-white/70">No hobbies yet. Add some from onboarding or projects.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userPassions.map((up) => (
              <li key={up.id} className="bg-white/10 rounded-md p-3 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{up.passion.icon || "🎯"}</span>
                    <div>
                      <div className="font-medium">{up.passion.name}</div>
                      {up.passion.description && (
                        <div className="text-sm text-white/70">{up.passion.description}</div>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/projects?create=1&passionId=${up.passion.id}`}
                    className="text-sm bg-secondary-400 text-primary-800 px-3 py-1 rounded-md hover:bg-secondary-500"
                  >
                    Start new project
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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


