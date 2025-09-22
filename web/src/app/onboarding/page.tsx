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

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [passions, setPassions] = useState<Passion[]>([]);
  const [selectedPassions, setSelectedPassions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // Fetch available passions with simple format
      fetch("/api/passions?simple=true")
        .then(res => res.json())
        .then(data => {
          setPassions(data || []);
          setLoading(false);
        })
        .catch(() => {
          // If no passions exist, create some default ones
          setPassions(getDefaultPassions());
          setLoading(false);
        });
    }
  }, [status, router]);

  const getDefaultPassions = (): Passion[] => [
    { id: "1", name: "Art", slug: "art", description: "Creative visual expression", icon: "🎨", color: "#F97316" },
    { id: "2", name: "Cooking", slug: "cooking", description: "Culinary adventures", icon: "👨‍🍳", color: "#F59E0B" },
    { id: "3", name: "Writing", slug: "writing", description: "Words and stories", icon: "✍️", color: "#6B7280" },
    { id: "4", name: "Music", slug: "music", description: "Playing and listening", icon: "🎵", color: "#EC4899" },
    { id: "5", name: "Learning a Language", slug: "learning-a-language", description: "Expanding communication", icon: "🌍", color: "#3B82F6" },
    { id: "6", name: "Gardening", slug: "gardening", description: "Growing plants and food", icon: "🌱", color: "#22C55E" },
    { id: "7", name: "Studying", slug: "studying", description: "Academic pursuits", icon: "📚", color: "#8B5CF6" },
    { id: "8", name: "Composing", slug: "composing", description: "Creating musical works", icon: "🎼", color: "#EF4444" },
  ];

  const handlePassionToggle = (passionId: string) => {
    setSelectedPassions(prev => 
      prev.includes(passionId) 
        ? prev.filter(id => id !== passionId)
        : [...prev, passionId]
    );
  };

  const handleSubmit = async () => {
    if (selectedPassions.length === 0) {
      setError("Please select at least one hobby to continue");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Save selected passions
      const response = await fetch("/api/user/passions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passionIds: selectedPassions }),
      });

      if (response.ok) {
        console.log("Passions saved successfully, navigating to details page...");
        // Small delay to ensure database operation completes
        setTimeout(() => {
          router.push("/onboarding/passions");
        }, 100);
      } else {
        setError("Failed to save your selections. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-400 mx-auto mb-4"></div>
          <p className="text-white">Loading hobbies...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null; // Redirect happening
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Welcome to Pathos!</h1>
        <p className="text-white/80 text-lg">What are you passionate about? Choose your hobbies to get started.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {passions.map((passion) => (
          <div
            key={passion.id}
            onClick={() => handlePassionToggle(passion.id)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105
              ${selectedPassions.includes(passion.id)
                ? 'border-secondary-400 bg-secondary-400/20 shadow-lg'
                : 'border-white/20 bg-white/10 hover:border-white/40'
              }
            `}
          >
            {/* Selection indicator */}
            <div className={`
              absolute top-2 right-2 w-4 h-4 rounded-full border-2 transition-all
              ${selectedPassions.includes(passion.id)
                ? 'bg-secondary-400 border-secondary-400'
                : 'border-white/40'
              }
            `}>
              {selectedPassions.includes(passion.id) && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-800 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Icon */}
            <div className="text-2xl mb-2">
              {passion.icon || "🎯"}
            </div>

            {/* Content */}
            <h3 className="font-semibold text-white mb-1">{passion.name}</h3>
            {passion.description && (
              <p className="text-sm text-white/70">{passion.description}</p>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-100 text-sm text-center p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="text-center">
        <p className="text-white/60 text-sm mb-4">
          Selected {selectedPassions.length} {selectedPassions.length === 1 ? 'hobby' : 'hobbies'}
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedPassions.length === 0}
          className="
            px-8 py-3 bg-secondary-400 text-primary-800 font-semibold rounded-lg
            hover:bg-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg hover:shadow-xl
          "
        >
          {submitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </main>
  );
}


