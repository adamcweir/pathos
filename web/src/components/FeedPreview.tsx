"use client";

import Link from "next/link";

type ActivityItem =
  | {
      type: "project_created";
      id: string;
      user: { name: string; image?: string };
      project: { title: string; passion: string };
      createdAt: string;
      progressPercent?: number;
      progressLabel?: string;
    }
  | {
      type: "milestone_completed";
      id: string;
      user: { name: string; image?: string };
      project: { title: string };
      milestone: { title: string };
      completedAt: string;
      progressPercent?: number;
      progressLabel?: string;
    }
  | {
      type: "entry_created";
      id: string;
      user: { name: string; image?: string };
      project: { title: string };
      minutes: number;
      note?: string;
      createdAt: string;
      progressPercent?: number;
      progressLabel?: string;
    };

const previewItems: ActivityItem[] = [
  {
    type: "project_created",
    id: "p1",
    user: { name: "Maya Patel" },
    project: { title: "Hand‑crafted Walnut Coffee Table", passion: "Woodworking" },
    createdAt: new Date().toISOString(),
    progressPercent: 50,
    progressLabel: "progress",
  },
  {
    type: "entry_created",
    id: "e1",
    user: { name: "Jon Reyes" },
    project: { title: "Baroque Violin Etudes" },
    minutes: 45,
    note: "Intonation is getting cleaner in positions 3–5. Worked on vibrato control.",
    createdAt: new Date().toISOString(),
    progressPercent: 38,
    progressLabel: "weekly goal",
  },
  {
    type: "milestone_completed",
    id: "m1",
    user: { name: "Ava Chen" },
    project: { title: "Neuroscience Reading Group" },
    milestone: { title: "Finished preprint summary on synaptic scaling" },
    completedAt: new Date().toISOString(),
    progressPercent: 62,
    progressLabel: "chapter progress",
  },
  {
    type: "project_created",
    id: "p2",
    user: { name: "Luis Gomez" },
    project: { title: "Urban Sketching: 30‑day Alley Series", passion: "Art" },
    createdAt: new Date().toISOString(),
    progressPercent: 80,
    progressLabel: "day 1 of 30",
  },
  {
    type: "entry_created",
    id: "e2",
    user: { name: "Maya Patel" },
    project: { title: "Hand‑crafted Walnut Coffee Table" },
    minutes: 80,
    note: "Dovetail joints cut and dry‑fit. Next: final sand and oil finish.",
    createdAt: new Date().toISOString(),
    progressPercent: 24,
    progressLabel: "build progress",
  },
  {
    type: "milestone_completed",
    id: "m2",
    user: { name: "Jon Reyes" },
    project: { title: "Baroque Violin Etudes" },
    milestone: { title: "Etude No. 3 at tempo" },
    completedAt: new Date().toISOString(),
    progressPercent: 45,
    progressLabel: "set complete",
  },
];

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-accent-400 text-primary-900 flex items-center justify-center font-bold shadow-soft">
      {initial}
    </div>
  );
}

function Header({ name, verb }: { name: string; verb: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} />
      <div className="text-black">
        <span className="font-semibold text-black">{name}</span> {verb}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-secondary-400 px-2 py-0.5 text-xs font-semibold text-primary-900">
      {label}
    </span>
  );
}

function ProgressBar({ percent }: { percent?: number }) {
  if (percent == null) return null;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="mt-2">
      <div className="h-2 rounded bg-neutral-200 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
        <div
          className="h-2 bg-secondary-400 rounded transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-black">{clamped}%</div>
    </div>
  );
}

function Actions() {
  return (
    <div className="mt-3 text-sm text-black">
      <button className="hover:text-black">like</button>
      <span className="mx-2">·</span>
      <button className="hover:text-black">comment</button>
      <span className="mx-2">·</span>
      <Link href="/auth" className="hover:text-black underline underline-offset-2">see project</Link>
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const base = "p-4 md:p-5";

  if (item.type === "project_created") {
    return (
      <article className={base}>
        <Header name={item.user.name} verb="started a new project" />
        <h3 className="mt-2 text-lg font-semibold text-black">{item.project.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-sm text-black">
          <Badge label={item.project.passion} />
          <span>Just now</span>
        </div>
        <ProgressBar percent={item.progressPercent} />
        <Actions />
      </article>
    );
  }

  if (item.type === "milestone_completed") {
    return (
      <article className={base}>
        <Header name={item.user.name} verb="hit a milestone" />
        <h3 className="mt-2 text-lg font-semibold text-black">{item.milestone.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-sm text-black">
          <Badge label="Completed" />
          <span>in {item.project.title}</span>
        </div>
        <ProgressBar percent={item.progressPercent} />
        <Actions />
      </article>
    );
  }

  return (
    <article className={base}>
      <Header name={item.user.name} verb="logged time" />
      <h3 className="mt-2 text-lg font-semibold text-black">{item.project.title}</h3>
      {item.note ? (
        <p className="text-black mt-1 line-clamp-2">{item.note}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-3 text-sm text-black">
        <Badge label={`${item.minutes} min`} />
        <span>Just now</span>
      </div>
      <ProgressBar percent={item.progressPercent} />
      <Actions />
    </article>
  );
}

export default function FeedPreview() {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-24">
      <div className="rounded-2xl bg-white text-black shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-semibold text-black">Activity Feed</h2>
          <Link href="/auth" className="inline-flex items-center gap-2 bg-primary-800 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-700">
            Create your own
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>

        <div>
          {previewItems.map((it, idx) => (
            <div key={`${it.type}-${it.id}`} className={idx === previewItems.length - 1 ? "" : "border-b border-neutral-200"}>
              <ActivityCard item={it} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


