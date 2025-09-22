"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Passion {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UserPassion {
  id: string;
  passion: Passion;
}

interface PassionDetails {
  passionId: string;
  specificArea?: string;
  currentLevel?: string;
  activeProjects: {
    title: string;
    description: string;
    nextSteps: string[];
  }[];
}

export default function PassionDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userPassions, setUserPassions] = useState<UserPassion[]>([]);
  const [currentPassionIndex, setCurrentPassionIndex] = useState(0);
  const [passionDetails, setPassionDetails] = useState<Record<string, PassionDetails>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // Fetch user's selected passions
      fetch("/api/user/passions")
        .then(res => res.json())
        .then(data => {
          if (data.userPassions && data.userPassions.length > 0) {
            setUserPassions(data.userPassions);
            // Initialize empty details for each passion
            const initialDetails: Record<string, PassionDetails> = {};
            data.userPassions.forEach((up: UserPassion) => {
              initialDetails[up.passion.id] = {
                passionId: up.passion.id,
                specificArea: "",
                currentLevel: "",
                activeProjects: [{ title: "", description: "", nextSteps: [""] }]
              };
            });
            setPassionDetails(initialDetails);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load your passions. Please try again.");
          setLoading(false);
        });
    }
  }, [status, router]);

  const currentPassion = userPassions[currentPassionIndex];

  const updatePassionDetail = (field: keyof PassionDetails, value: any) => {
    if (!currentPassion) return;
    setPassionDetails(prev => ({
      ...prev,
      [currentPassion.passion.id]: {
        ...prev[currentPassion.passion.id],
        [field]: value
      }
    }));
  };

  const updateProject = (projectIndex: number, field: keyof PassionDetails['activeProjects'][0], value: any) => {
    if (!currentPassion) return;
    const currentDetails = passionDetails[currentPassion.passion.id];
    const updatedProjects = [...currentDetails.activeProjects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      [field]: value
    };
    updatePassionDetail('activeProjects', updatedProjects);
  };

  const addProject = () => {
    if (!currentPassion) return;
    const currentDetails = passionDetails[currentPassion.passion.id];
    updatePassionDetail('activeProjects', [
      ...currentDetails.activeProjects,
      { title: "", description: "", nextSteps: [""] }
    ]);
  };

  const addNextStep = (projectIndex: number) => {
    if (!currentPassion) return;
    const currentDetails = passionDetails[currentPassion.passion.id];
    const updatedProjects = [...currentDetails.activeProjects];
    updatedProjects[projectIndex].nextSteps.push("");
    updatePassionDetail('activeProjects', updatedProjects);
  };

  const updateNextStep = (projectIndex: number, stepIndex: number, value: string) => {
    if (!currentPassion) return;
    const currentDetails = passionDetails[currentPassion.passion.id];
    const updatedProjects = [...currentDetails.activeProjects];
    updatedProjects[projectIndex].nextSteps[stepIndex] = value;
    updatePassionDetail('activeProjects', updatedProjects);
  };

  const handleNext = () => {
    if (currentPassionIndex < userPassions.length - 1) {
      setCurrentPassionIndex(currentPassionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    if (currentPassionIndex < userPassions.length - 1) {
      setCurrentPassionIndex(currentPassionIndex + 1);
    } else {
      router.push("/profile");
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Save all passion details and create projects
      const response = await fetch("/api/onboarding/passion-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passionDetails }),
      });

      if (response.ok) {
        router.push("/profile");
      } else {
        setError("Failed to save your details. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your passions...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated" || userPassions.length === 0) {
    return null; // Redirect happening
  }

  const currentDetails = passionDetails[currentPassion.passion.id];

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Tell us more about your passions</h1>
          <div className="text-sm text-white/60">
            {currentPassionIndex + 1} of {userPassions.length}
          </div>
        </div>
        
        <div className="flex space-x-2 mb-6">
          {userPassions.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded ${
                index === currentPassionIndex
                  ? 'bg-secondary-400'
                  : index < currentPassionIndex
                  ? 'bg-accent-400'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">{currentPassion.passion.icon || "🎯"}</span>
          <div>
            <h2 className="text-xl font-semibold text-white">{currentPassion.passion.name}</h2>
            <p className="text-white/70">{currentPassion.passion.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Specific Area */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What specific area of {currentPassion.passion.name.toLowerCase()} interests you most?
            </label>
            <input
              type="text"
              value={currentDetails?.specificArea || ""}
              onChange={(e) => updatePassionDetail('specificArea', e.target.value)}
              placeholder={getSpecificAreaPlaceholder(currentPassion.passion.slug)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-400"
            />
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              How would you describe your current level?
            </label>
            <select
              value={currentDetails?.currentLevel || ""}
              onChange={(e) => updatePassionDetail('currentLevel', e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-secondary-400"
            >
              <option value="">Select your level</option>
              <option value="beginner">Beginner - Just starting out</option>
              <option value="intermediate">Intermediate - Have some experience</option>
              <option value="advanced">Advanced - Quite experienced</option>
              <option value="expert">Expert - Very skilled/professional</option>
            </select>
          </div>

          {/* Active Projects */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Active Projects</h3>
            {currentDetails?.activeProjects.map((project, projectIndex) => (
              <div key={projectIndex} className="bg-white/5 rounded-md p-4 mb-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => updateProject(projectIndex, 'title', e.target.value)}
                    placeholder="Project title"
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-400"
                  />
                  
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(projectIndex, 'description', e.target.value)}
                    placeholder="Brief description of this project"
                    rows={2}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-400 resize-none"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Next Steps:</label>
                    {project.nextSteps.map((step, stepIndex) => (
                      <input
                        key={stepIndex}
                        type="text"
                        value={step}
                        onChange={(e) => updateNextStep(projectIndex, stepIndex, e.target.value)}
                        placeholder={`Step ${stepIndex + 1}`}
                        className="w-full px-3 py-2 mb-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary-400"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => addNextStep(projectIndex)}
                      className="text-sm text-secondary-400 hover:text-secondary-300"
                    >
                      + Add another step
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addProject}
              className="text-secondary-400 hover:text-secondary-300 text-sm"
            >
              + Add another project
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-100 text-sm text-center p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={handleSkip}
          className="px-6 py-2 text-white/70 hover:text-white border border-white/30 rounded-md"
        >
          Skip for now
        </button>
        
        <button
          onClick={handleNext}
          disabled={submitting}
          className="px-6 py-2 bg-secondary-400 text-primary-800 font-semibold rounded-md hover:bg-secondary-500 disabled:opacity-50"
        >
          {submitting ? "Saving..." : currentPassionIndex < userPassions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </main>
  );
}

function getSpecificAreaPlaceholder(slug: string): string {
  const placeholders: Record<string, string> = {
    'art': 'e.g., Digital illustration, Oil painting, Sculpture, Photography',
    'cooking': 'e.g., Italian cuisine, Baking, Vegan cooking, Molecular gastronomy',
    'writing': 'e.g., Science fiction, Poetry, Technical writing, Screenwriting',
    'music': 'e.g., Jazz piano, Classical guitar, Electronic production, Vocals',
    'learning-a-language': 'e.g., Spanish, Mandarin, French, Japanese',
    'gardening': 'e.g., Vegetable gardening, Houseplants, Landscaping, Hydroponics',
    'studying': 'e.g., Computer Science, History, Psychology, Mathematics',
    'composing': 'e.g., Film scores, Pop songs, Classical symphonies, Electronic music'
  };
  
  return placeholders[slug] || 'e.g., Your specific area of interest';
}