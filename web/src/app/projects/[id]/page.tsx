import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getData(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      passion: { select: { id: true, name: true, icon: true } },
    },
  });
  if (!project || project.userId !== userId) return null;

  const [entries, milestones] = await Promise.all([
    prisma.entry.findMany({
      where: { userId, projectId },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { id: true, title: true, type: true, publishedAt: true },
    }),
    prisma.milestone.findMany({
      where: { userId, projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        targetDate: true,
      },
    }),
  ]);

  return { project, entries, milestones };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const data = await getData(session.user.id, params.id);
  if (!data) redirect("/projects");

  const { project, entries, milestones } = data;

  return (
    <main className="p-6 max-w-3xl mx-auto text-white">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.passion?.icon || "🎯"}</span>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="text-sm text-white/70">{project.passion?.name}</div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Recent updates</h2>
        {entries.length === 0 ? (
          <div className="text-white/70">No updates yet.</div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="bg-white/10 rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-white/60">{e.type} · {new Date(e.publishedAt!).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Upcoming milestones</h2>
        {milestones.length === 0 ? (
          <div className="text-white/70">No milestones yet.</div>
        ) : (
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li key={m.id} className="bg-white/10 rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-white/60">{m.status}{m.targetDate ? ` · due ${new Date(m.targetDate).toLocaleDateString()}` : ""}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NextStepsForm projectId={project.id} />
    </main>
  );
}

function NextStepsForm({ projectId }: { projectId: string }) {
  return (
    <form action="/api/tasks" method="post" className="bg-white/10 rounded-md p-4">
      <h3 className="text-lg font-semibold mb-2">Set next steps</h3>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex gap-2 mb-3">
        <input name="title" placeholder="Next step" className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50" />
        <button formAction={async (formData) => {
          "use server";
          const title = String(formData.get("title") || "").trim();
          if (!title) return;
          const projectId = String(formData.get("projectId"));
          // Basic server action using fetch to our own API to reuse validation/ownership checks
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, projectId }),
          });
        }} className="bg-secondary-400 text-primary-800 px-4 rounded-md hover:bg-secondary-500">Add</button>
      </div>
      <div className="text-white/60 text-sm">Add a quick next step to keep momentum.</div>
    </form>
  );
}


