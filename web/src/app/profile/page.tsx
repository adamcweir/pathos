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

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Your profile</h1>
      <ProfileForm
        initialName={user?.name ?? ""}
        initialLocation={user?.location ?? ""}
        initialPrivacy={(user?.privacy as "private" | "friends" | "public") ?? "public"}
      />
    </main>
  );
}


