"use client";

import { useState } from "react";

interface Passion {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UserPassion {
  id: string;
  passion: Passion;
}

interface PassionManagerProps {
  userPassions: UserPassion[];
  onPassionAdded: (newPassion: UserPassion) => void;
}

export function PassionManager({ userPassions, onPassionAdded }: PassionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassion, setNewPassion] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/passions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPassion),
      });

      if (!response.ok) {
        throw new Error("Failed to create passion");
      }

      const data = await response.json();

      // Call the callback to update the parent component
      onPassionAdded({
        id: `user_passion_${Date.now()}`, // Temporary ID
        passion: data.passion,
      });

      // Reset form
      setNewPassion({
        name: "",
        description: "",
        icon: "",
        color: "#3B82F6",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating passion:", error);
      alert("Failed to create passion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const emojiOptions = ["🎨", "🎵", "📚", "✍️", "🌱", "🍳", "🏃", "📸", "🎯", "🔧", "🎮", "🧑‍💻"];

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-white">Your hobbies</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm bg-secondary-400 text-primary-800 px-3 py-1 rounded-md hover:bg-secondary-500 transition-colors"
        >
          {showAddForm ? "Cancel" : "Add New Hobby"}
        </button>
      </div>

      {/* Add New Passion Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newPassion.name}
                onChange={(e) => setNewPassion({ ...newPassion, name: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                placeholder="e.g. Photography, Cooking, Reading"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newPassion.description}
                onChange={(e) => setNewPassion({ ...newPassion, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                rows={2}
                placeholder="Brief description of this passion"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewPassion({ ...newPassion, icon: emoji })}
                      className={`p-2 text-lg border rounded ${
                        newPassion.icon === emoji
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newPassion.icon}
                  onChange={(e) => setNewPassion({ ...newPassion, icon: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                  placeholder="Or type your own emoji"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newPassion.color}
                  onChange={(e) => setNewPassion({ ...newPassion, color: e.target.value })}
                  className="w-full h-10 p-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newPassion.name.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Hobby"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Passions List */}
      {userPassions.length === 0 ? (
        <div className="text-white/70">No hobbies yet. Add your first hobby above!</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userPassions.map((up) => (
            <li key={up.id} className="bg-white/10 rounded-md p-3 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{up.passion.icon || "🎯"}</span>
                  <div>
                    <div className="font-medium">{up.passion.name}</div>
                    {up.passion.description && (
                      <div className="text-sm text-white/70">{up.passion.description}</div>
                    )}
                  </div>
                </div>
                <a
                  href={`/projects?create=1&passionId=${up.passion.id}`}
                  className="text-sm bg-secondary-400 text-primary-800 px-3 py-1 rounded-md hover:bg-secondary-500"
                >
                  Start new project
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}