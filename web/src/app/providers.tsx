"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { SessionProvider } from "next-auth/react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    if (key) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        loaded: (ph) => {
          // Respect Do Not Track in dev by default
          if (process.env.NODE_ENV !== "production" && typeof navigator !== "undefined") {
            const dntEnabled = (navigator as Navigator).doNotTrack === "1";
            if (dntEnabled) ph.opt_out_capturing();
          }
        },
      });

      // Initial pageview for App Router on first mount
      posthog.capture("$pageview");
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}


