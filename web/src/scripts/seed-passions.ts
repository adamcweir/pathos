import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPassions = [
  // Technology
  { name: "Programming", slug: "programming", icon: "💻", color: "#3B82F6" },
  { name: "Web Development", slug: "web-development", icon: "🌐", color: "#10B981", parentSlug: "programming" },
  { name: "Mobile Development", slug: "mobile-development", icon: "📱", color: "#8B5CF6", parentSlug: "programming" },
  { name: "Data Science", slug: "data-science", icon: "📊", color: "#F59E0B" },
  { name: "Machine Learning", slug: "machine-learning", icon: "🤖", color: "#EF4444", parentSlug: "data-science" },
  { name: "Cybersecurity", slug: "cybersecurity", icon: "🔒", color: "#6B7280" },
  
  // Creative Arts
  { name: "Art & Design", slug: "art-design", icon: "🎨", color: "#EC4899" },
  { name: "Digital Art", slug: "digital-art", icon: "✨", color: "#A855F7", parentSlug: "art-design" },
  { name: "Photography", slug: "photography", icon: "📸", color: "#059669" },
  { name: "Music", slug: "music", icon: "🎵", color: "#DC2626" },
  { name: "Writing", slug: "writing", icon: "✍️", color: "#7C2D12" },
  
  // Languages
  { name: "Language Learning", slug: "language-learning", icon: "🗣️", color: "#0284C7" },
  { name: "Spanish", slug: "spanish", icon: "🇪🇸", color: "#DC2626", parentSlug: "language-learning" },
  { name: "Japanese", slug: "japanese", icon: "🇯🇵", color: "#DC2626", parentSlug: "language-learning" },
  { name: "French", slug: "french", icon: "🇫🇷", color: "#2563EB", parentSlug: "language-learning" },
  
  // Health & Fitness
  { name: "Fitness", slug: "fitness", icon: "💪", color: "#16A34A" },
  { name: "Running", slug: "running", icon: "🏃", color: "#059669", parentSlug: "fitness" },
  { name: "Yoga", slug: "yoga", icon: "🧘", color: "#7C3AED", parentSlug: "fitness" },
  { name: "Cooking", slug: "cooking", icon: "👨‍🍳", color: "#EA580C" },
  
  // Academic
  { name: "Mathematics", slug: "mathematics", icon: "🔢", color: "#1E40AF" },
  { name: "Science", slug: "science", icon: "🔬", color: "#0F766E" },
  { name: "History", slug: "history", icon: "📚", color: "#92400E" },
  { name: "Philosophy", slug: "philosophy", icon: "🤔", color: "#6B21A8" },
  
  // Business & Career
  { name: "Entrepreneurship", slug: "entrepreneurship", icon: "🚀", color: "#DC2626" },
  { name: "Marketing", slug: "marketing", icon: "📈", color: "#059669" },
  { name: "Finance", slug: "finance", icon: "💰", color: "#0891B2" },
  
  // Hobbies
  { name: "Gaming", slug: "gaming", icon: "🎮", color: "#7C2D12" },
  { name: "Reading", slug: "reading", icon: "📖", color: "#1F2937" },
  { name: "Gardening", slug: "gardening", icon: "🌱", color: "#16A34A" },
  { name: "Travel", slug: "travel", icon: "✈️", color: "#0284C7" },
];

async function seedPassions() {
  console.log("Starting to seed default passions...");

  // Create a map to store passion IDs for parent relationships
  const passionMap = new Map<string, string>();

  // First pass: Create all passions without parents
  for (const passion of defaultPassions) {
    const { parentSlug, ...passionData } = passion;
    
    try {
      const existingPassion = await prisma.passion.findUnique({
        where: { slug: passion.slug },
      });

      if (!existingPassion) {
        const created = await prisma.passion.create({
          data: {
            ...passionData,
            description: `Explore and learn ${passion.name.toLowerCase()}`,
            isCustom: false,
          },
        });
        passionMap.set(passion.slug, created.id);
        console.log(`Created passion: ${passion.name}`);
      } else {
        passionMap.set(passion.slug, existingPassion.id);
        console.log(`Passion already exists: ${passion.name}`);
      }
    } catch (error) {
      console.error(`Error creating passion ${passion.name}:`, error);
    }
  }

  // Second pass: Update parent relationships
  for (const passion of defaultPassions) {
    if (passion.parentSlug && passionMap.has(passion.parentSlug)) {
      try {
        const passionId = passionMap.get(passion.slug);
        const parentId = passionMap.get(passion.parentSlug);

        if (passionId && parentId) {
          await prisma.passion.update({
            where: { id: passionId },
            data: { parentId },
          });
          console.log(`Set parent for ${passion.name} → ${passion.parentSlug}`);
        }
      } catch (error) {
        console.error(`Error setting parent for ${passion.name}:`, error);
      }
    }
  }

  console.log("Finished seeding passions!");
}

async function main() {
  try {
    await seedPassions();
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}