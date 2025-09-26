"use client";

import { useState } from "react";

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

interface Milestone {
  id: string;
  title: string;
  status: string;
}

interface TaskManagerProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
}

export function TaskManager({
  projectId,
  tasks,
  milestones,
  onTaskCreated,
  onTaskUpdated
}: TaskManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    milestoneId: "",
  });

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          projectId,
          milestoneId: newTask.milestoneId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const task = await response.json();

      // Reset form
      setNewTask({
        title: "",
        description: "",
        milestoneId: "",
      });
      setShowCreateForm(false);

      onTaskCreated(task);
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      onTaskUpdated(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const toggleTaskCompletion = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  const assignTaskToMilestone = (taskId: string, milestoneId: string | null) => {
    updateTask(taskId, { milestoneId });
  };

  // Group tasks by milestone
  const tasksByMilestone = tasks.reduce((acc, task) => {
    const key = task.milestoneId || "unassigned";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Next Steps</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm bg-secondary-400 text-primary-800 px-3 py-1 rounded-md hover:bg-secondary-500 transition-colors"
        >
          {showCreateForm ? "Cancel" : "Add Task"}
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-white rounded-lg">
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                placeholder="What needs to be done?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                rows={2}
                placeholder="Additional details (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Milestone
              </label>
              <select
                value={newTask.milestoneId}
                onChange={(e) => setNewTask({ ...newTask, milestoneId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
              >
                <option value="">No milestone</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title} ({milestone.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newTask.title.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
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

      {/* Tasks organized by milestone */}
      <div className="space-y-6">
        {/* Unassigned tasks */}
        {tasksByMilestone.unassigned && tasksByMilestone.unassigned.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white/90 mb-3">General Tasks</h3>
            <div className="space-y-2">
              {tasksByMilestone.unassigned.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  milestones={milestones}
                  onToggleComplete={toggleTaskCompletion}
                  onAssignMilestone={assignTaskToMilestone}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tasks by milestone */}
        {milestones.map((milestone) => {
          const milestoneTasks = tasksByMilestone[milestone.id];
          if (!milestoneTasks || milestoneTasks.length === 0) return null;

          return (
            <div key={milestone.id}>
              <h3 className="text-lg font-medium text-white/90 mb-3">
                📌 {milestone.title}
                <span className="text-sm text-white/60 ml-2">({milestone.status})</span>
              </h3>
              <div className="space-y-2 ml-4">
                {milestoneTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    milestones={milestones}
                    onToggleComplete={toggleTaskCompletion}
                    onAssignMilestone={assignTaskToMilestone}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-white/70">No tasks yet. Add your first task above to get started!</div>
        )}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  milestones,
  onToggleComplete,
  onAssignMilestone,
}: {
  task: Task;
  milestones: Milestone[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAssignMilestone: (taskId: string, milestoneId: string | null) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="bg-white/10 rounded-md p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleComplete(task.id, !task.completed)}
            className="text-lg"
          >
            {task.completed ? "✅" : "⏳"}
          </button>
          <div className={`flex-1 ${task.completed ? "opacity-50 line-through" : ""}`}>
            <div className="font-medium text-white">{task.title}</div>
            {task.description && (
              <div className="text-sm text-white/70 mt-1">{task.description}</div>
            )}
            <div className="text-xs text-white/60 mt-1">
              Added {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-white/60 hover:text-white text-sm"
        >
          ⚙️
        </button>
      </div>

      {showOptions && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <label className="block text-sm font-medium text-white/70 mb-1">
            Assign to Milestone
          </label>
          <select
            value={task.milestoneId || ""}
            onChange={(e) => onAssignMilestone(task.id, e.target.value || null)}
            className="w-full p-2 bg-white/20 border border-white/30 rounded-md text-white text-sm"
          >
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.title} ({milestone.status})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}