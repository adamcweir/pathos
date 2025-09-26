"use client";

import { useState } from "react";
import { TimeTracker } from "./TimeTracker";
import { MilestoneManager } from "./MilestoneManager";
import { TaskManager } from "./TaskManager";

interface Project {
  id: string;
  title: string;
  description?: string;
  passion?: {
    id: string;
    name: string;
    icon: string;
  };
}

interface Entry {
  id: string;
  title: string;
  type: string;
  publishedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: "planned" | "active" | "completed" | "skipped";
  targetDate?: string;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  milestoneId?: string;
  milestone?: {
    title: string;
    status: string;
  };
}

interface TimeEntry {
  id: string;
  description?: string;
  duration: number;
  startedAt: string;
  endedAt: string;
  task?: { title: string };
  milestone?: { title: string };
}

interface ProjectDetailClientProps {
  project: Project;
  initialEntries: Entry[];
  initialMilestones: Milestone[];
  initialTasks: Task[];
  initialTimeEntries: TimeEntry[];
  totalTimeSpent: number;
}

export function ProjectDetailClient({
  project,
  initialEntries,
  initialMilestones,
  initialTasks,
  initialTimeEntries,
  totalTimeSpent: initialTotalTime
}: ProjectDetailClientProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [totalTimeSpent, setTotalTimeSpent] = useState(initialTotalTime);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleMilestoneCreated = (milestone: Milestone) => {
    setMilestones(prev => [...prev, milestone]);
  };

  const handleMilestoneUpdated = (updatedMilestone: Milestone) => {
    setMilestones(prev =>
      prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m)
    );
  };

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev =>
      prev.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  };

  const handleTimeLogged = (timeEntry: TimeEntry) => {
    setTimeEntries(prev => [timeEntry, ...prev]);
    setTotalTimeSpent(prev => prev + timeEntry.duration);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto text-white">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{project.passion?.icon || "🎯"}</span>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <div className="text-white/70">{project.passion?.name}</div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-secondary-400">{totalTimeSpent > 0 ? formatTime(totalTimeSpent) : "0h"}</div>
            <div className="text-sm text-white/70">Total Time</div>
          </div>
          <div className="bg-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-accent-400">{milestones.length}</div>
            <div className="text-sm text-white/70">Milestones</div>
          </div>
          <div className="bg-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-primary-300">{tasks.filter(t => t.completed).length}/{tasks.length}</div>
            <div className="text-sm text-white/70">Tasks Done</div>
          </div>
          <div className="bg-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{initialEntries.length}</div>
            <div className="text-sm text-white/70">Updates</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Updates */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
            {initialEntries.length === 0 ? (
              <div className="text-white/70 bg-white/10 rounded-md p-4">No updates yet.</div>
            ) : (
              <div className="space-y-3">
                {initialEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="bg-white/10 rounded-md p-4">
                    <div className="font-medium">{entry.title}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {entry.type} · {new Date(entry.publishedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Milestones */}
          <section>
            <MilestoneManager
              projectId={project.id}
              milestones={milestones}
              onMilestoneCreated={handleMilestoneCreated}
              onMilestoneUpdated={handleMilestoneUpdated}
            />
          </section>

          {/* Tasks */}
          <section>
            <TaskManager
              projectId={project.id}
              tasks={tasks}
              milestones={milestones}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracker */}
          <TimeTracker
            projectId={project.id}
            onTimeLogged={handleTimeLogged}
          />

          {/* Recent Time Entries */}
          <div className="bg-white/10 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Time Logs</h3>
            {timeEntries.length === 0 ? (
              <div className="text-white/70 text-sm">No time logged yet.</div>
            ) : (
              <div className="space-y-2">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatTime(entry.duration)}</span>
                      <span className="text-white/60">
                        {new Date(entry.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.description && (
                      <div className="text-white/70 text-xs mt-1">{entry.description}</div>
                    )}
                    {(entry.task || entry.milestone) && (
                      <div className="text-white/60 text-xs">
                        {entry.task ? `Task: ${entry.task.title}` : `Milestone: ${entry.milestone?.title}`}
                      </div>
                    )}
                  </div>
                ))}
                {timeEntries.length > 5 && (
                  <div className="text-xs text-white/60 text-center pt-2">
                    +{timeEntries.length - 5} more entries
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}