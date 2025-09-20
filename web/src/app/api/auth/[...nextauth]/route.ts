export const dynamic = "force-dynamic"; // ensure route works without static envs at build

import { auth } from "@/lib/auth";

export { auth as GET, auth as POST };


