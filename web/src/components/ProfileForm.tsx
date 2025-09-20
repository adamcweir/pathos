"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import posthog from "posthog-js";

type Privacy = "private" | "friends" | "public";

const profileSchema = z.object({
  name: z.string().min(1, "Required"),
  location: z.string().optional().nullable(),
  privacy: z.enum(["private", "friends", "public"]),
});

type ProfileFormProps = {
  initialName?: string | null;
  initialLocation?: string | null;
  initialPrivacy?: Privacy;
  redirectPath?: string;
};

export function ProfileForm({
  initialName,
  initialLocation,
  initialPrivacy = "public",
  redirectPath,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [location, setLocation] = useState(initialLocation ?? "");
  const [privacy, setPrivacy] = useState<Privacy>(initialPrivacy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = profileSchema.safeParse({ name, location, privacy });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Failed to save");
      posthog.capture("profile_updated");
      if (redirectPath) router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Location</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Privacy</label>
        <select
          className="mt-1 w-full border rounded px-3 py-2"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as Privacy)}
        >
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Private</option>
        </select>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        className="rounded border px-4 py-2 disabled:opacity-50"
        type="submit"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}


