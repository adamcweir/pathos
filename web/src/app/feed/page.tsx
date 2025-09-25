import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Your feed</h1>
      <div className="text-white/70">There are no updates yet. Start a project to see activity here.</div>
    </main>
  );
}


