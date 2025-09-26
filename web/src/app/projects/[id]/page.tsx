import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectDetailClient } from "@/components/ProjectDetailClient";

async function getData(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      passion: { select: { id: true, name: true, icon: true } },
    },
  });
  if (!project || project.userId !== userId) return null;

  const [entries, milestones, tasks, timeEntries] = await Promise.all([
    prisma.entry.findMany({
      where: { userId, projectId },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: { id: true, title: true, type: true, publishedAt: true },
    }),
    prisma.milestone.findMany({
      where: { userId, projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        tasks: {
          select: { id: true, title: true, completed: true },
          orderBy: { order: "asc" }
        }
      },
    }),
    prisma.task.findMany({
      where: { userId, projectId },
      orderBy: [{ completed: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      include: {
        milestone: {
          select: { title: true, status: true }
        }
      },
    }),
    prisma.timeEntry.findMany({
      where: { userId, projectId },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        task: { select: { title: true } },
        milestone: { select: { title: true } }
      },
    }),
  ]);

  // Calculate total time spent
  const totalTimeSpent = timeEntries.reduce((total, entry) => total + entry.duration, 0);

  return { project, entries, milestones, tasks, timeEntries, totalTimeSpent };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const data = await getData(session.user.id, params.id);
  if (!data) redirect("/projects");

  const { project, entries, milestones, tasks, timeEntries, totalTimeSpent } = data;

  return (
    <ProjectDetailClient
      project={project}
      initialEntries={entries}
      initialMilestones={milestones}
      initialTasks={tasks}
      initialTimeEntries={timeEntries}
      totalTimeSpent={totalTimeSpent}
    />
  );
}


