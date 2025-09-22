"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login
        const result = await signIn("credentials", {
          username: formData.username,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid username or password");
        } else {
          // Refresh session and redirect
          await getSession();
          router.push("/");
          router.refresh();
        }
      } else {
        // Signup
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          // Auto-login after successful signup
          const result = await signIn("credentials", {
            username: formData.username,
            password: formData.password,
            redirect: false,
          });

          if (result?.error) {
            setError("Account created but login failed. Please try logging in manually.");
          } else {
            await getSession();
            router.push("/");
            router.refresh();
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to create account");
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-white">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({ username: "", email: "", password: "" });
              }}
              className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-medium p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-black mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-primary-400 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-primary-400 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-neutral-300 placeholder-primary-400 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-primary-800 bg-secondary-400 hover:bg-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-medium hover:shadow-large transition-all"
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}