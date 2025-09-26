import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfilePageClient } from "@/components/ProfilePageClient";

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
    <ProfilePageClient
      user={user}
      initialUserPassions={userPassions}
      projects={projects}
    />
  );
}


