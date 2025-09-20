"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProjectStatus, ProjectStage } from "@prisma/client";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  stage: ProjectStage;
  privacy: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  passion: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
  };
  user: {
    id: string;
    username: string;
    name?: string;
    image?: string;
  };
}

interface Passion {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800", 
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
};

const stageEmojis = {
  idea: "💡",
  planning: "📋",
  development: "🔨",
  testing: "🧪",
  launch: "🚀",
  maintenance: "🔧",
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [passions, setPassions] = useState<Passion[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    passionId: "",
    status: ProjectStatus.active,
    stage: ProjectStage.idea,
  });

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
      fetchPassions();
    }
  }, [session, selectedStatus]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      
      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPassions = async () => {
    try {
      const response = await fetch("/api/user/passions");
      if (response.ok) {
        const data = await response.json();
        setPassions(data.userPassions.map((up: any) => up.passion));
      }
    } catch (error) {
      console.error("Error fetching passions:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setNewProject({
          title: "",
          description: "",
          passionId: "",
          status: ProjectStatus.active,
          stage: ProjectStage.idea,
        });
        setShowCreateForm(false);
        fetchProjects();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  if (!session?.user) {
    return (
      <div className="p-6">
        <p>Please sign in to view your projects.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Project
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          {Object.values(ProjectStatus).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                selectedStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Passion</label>
              <select
                value={newProject.passionId}
                onChange={(e) => setNewProject({...newProject, passionId: e.target.value})}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a passion</option>
                {passions.map((passion) => (
                  <option key={passion.id} value={passion.id}>
                    {passion.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value as ProjectStatus})}
                  className="p-2 border rounded-md"
                >
                  {Object.values(ProjectStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stage</label>
                <select
                  value={newProject.stage}
                  onChange={(e) => setNewProject({...newProject, stage: e.target.value as ProjectStage})}
                  className="p-2 border rounded-md"
                >
                  {Object.values(ProjectStage).map((stage) => (
                    <option key={stage} value={stage}>
                      {stageEmojis[stage]} {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No projects found.</p>
          {selectedStatus !== "all" && (
            <p className="text-sm text-gray-500 mt-2">
              Try changing the status filter or create your first project.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{stageEmojis[project.stage]}</span>
                <span className="text-sm font-medium capitalize">{project.stage}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {project.passion.icon && <span>{project.passion.icon}</span>}
                <span>{project.passion.name}</span>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}