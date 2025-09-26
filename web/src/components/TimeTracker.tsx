"use client";

import { useState } from "react";

interface TimeEntry {
  id: string;
  description?: string;
  duration: number;
  startedAt: string;
  endedAt: string;
  task?: { title: string };
  milestone?: { title: string };
}

interface TimeTrackerProps {
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  onTimeLogged?: (entry: TimeEntry) => void;
}

export function TimeTracker({ projectId, taskId, milestoneId, onTimeLogged }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const startTracking = () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);
    setElapsedTime(0);

    // Update elapsed time every minute
    const interval = setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - now.getTime()) / (1000 * 60));
        setElapsedTime(elapsed);
      }
    }, 60000);

    // Store interval ID to clear it later
    (window as globalThis.Window & { timeTrackingInterval?: NodeJS.Timeout }).timeTrackingInterval = interval;
  };

  const stopTracking = () => {
    setIsTracking(false);
    const w = window as globalThis.Window & { timeTrackingInterval?: NodeJS.Timeout };
    if (w.timeTrackingInterval) {
      clearInterval(w.timeTrackingInterval);
    }
  };

  const saveTimeEntry = async () => {
    if (!startTime) return;

    setIsSubmitting(true);

    try {
      const endTime = new Date();
      const duration = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)));

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim() || undefined,
          duration,
          projectId,
          taskId,
          milestoneId,
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save time entry");
      }

      const timeEntry = await response.json();

      // Reset form
      setStartTime(null);
      setElapsedTime(0);
      setDescription("");
      setIsTracking(false);

      if (onTimeLogged) {
        onTimeLogged(timeEntry);
      }

      alert(`Time logged: ${formatTime(duration)}`);
    } catch (error) {
      console.error("Error saving time entry:", error);
      alert("Failed to save time entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const discardSession = () => {
    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription("");
    const w = window as globalThis.Window & { timeTrackingInterval?: NodeJS.Timeout };
    if (w.timeTrackingInterval) {
      clearInterval(w.timeTrackingInterval);
    }
  };

  return (
    <div className="bg-white/10 rounded-md p-4">
      <h3 className="text-lg font-semibold mb-4 text-white">Time Tracking</h3>

      {!isTracking && !startTime && (
        <div className="space-y-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on? (optional)"
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50"
          />
          <button
            onClick={startTracking}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span>▶️</span>
            Start Timer
          </button>
        </div>
      )}

      {isTracking && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-mono text-white mb-2">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-white/70 text-sm">
              Started at {startTime?.toLocaleTimeString()}
            </div>
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on? (optional)"
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50"
          />

          <div className="flex gap-2">
            <button
              onClick={stopTracking}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              ⏸️ Stop
            </button>
          </div>
        </div>
      )}

      {!isTracking && startTime && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-xl font-mono text-white mb-2">
              Session: {formatTime(Math.max(1, Math.floor((Date.now() - startTime.getTime()) / (1000 * 60))))}
            </div>
            <div className="text-white/70 text-sm">
              {startTime.toLocaleTimeString()} - {new Date().toLocaleTimeString()}
            </div>
          </div>

          {description && (
            <div className="bg-white/10 rounded p-2 text-white text-sm">
              <strong>Description:</strong> {description}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveTimeEntry}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "💾 Save"}
            </button>
            <button
              onClick={discardSession}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              🗑️ Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}