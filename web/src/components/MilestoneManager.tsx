"use client";

import { useState } from "react";

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

interface MilestoneManagerProps {
  projectId: string;
  milestones: Milestone[];
  onMilestoneCreated: (milestone: Milestone) => void;
  onMilestoneUpdated: (milestone: Milestone) => void;
}

export function MilestoneManager({
  projectId,
  milestones,
  onMilestoneCreated,
  onMilestoneUpdated
}: MilestoneManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    targetDate: "",
  });

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newMilestone.title,
          description: newMilestone.description || undefined,
          projectId,
          targetDate: newMilestone.targetDate || undefined,
          order: milestones.length, // Put at the end
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create milestone");
      }

      const milestone = await response.json();

      // Reset form
      setNewMilestone({
        title: "",
        description: "",
        targetDate: "",
      });
      setShowCreateForm(false);

      onMilestoneCreated(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      alert("Failed to create milestone. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: Milestone["status"]) => {
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update milestone");
      }

      const updatedMilestone = await response.json();
      onMilestoneUpdated(updatedMilestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      alert("Failed to update milestone. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-gray-500";
      case "active": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "skipped": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const calculateProgress = (tasks: Milestone["tasks"]) => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Milestones</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm bg-secondary-400 text-primary-800 px-3 py-1 rounded-md hover:bg-secondary-500 transition-colors"
        >
          {showCreateForm ? "Cancel" : "Add Milestone"}
        </button>
      </div>

      {/* Create Milestone Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white rounded-lg">
          <form onSubmit={createMilestone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                placeholder="e.g. Complete first draft, Launch MVP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                rows={2}
                placeholder="Optional description of this milestone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newMilestone.title.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Milestone"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-white/70">No milestones yet. Create one to break your project into manageable goals!</div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const progress = calculateProgress(milestone.tasks);

            return (
              <div key={milestone.id} className="bg-white/10 rounded-md p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-white/70 text-sm mt-1">{milestone.description}</p>
                    )}
                    {milestone.targetDate && (
                      <p className="text-white/60 text-xs mt-1">
                        Target: {new Date(milestone.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {milestone.tasks.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {milestone.tasks.filter(t => t.completed).length} of {milestone.tasks.length} tasks completed
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-2 text-sm">
                  {milestone.status !== "active" && milestone.status !== "completed" && (
                    <button
                      onClick={() => updateMilestoneStatus(milestone.id, "active")}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Start
                    </button>
                  )}
                  {milestone.status !== "completed" && (
                    <button
                      onClick={() => updateMilestoneStatus(milestone.id, "completed")}
                      className="text-green-400 hover:text-green-300"
                    >
                      Mark Complete
                    </button>
                  )}
                  {milestone.status === "completed" && (
                    <button
                      onClick={() => updateMilestoneStatus(milestone.id, "active")}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}