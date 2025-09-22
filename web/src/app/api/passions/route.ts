import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createPassionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const includeUserPassions = searchParams.get("includeUserPassions") === "true";

    // Get all passions
    let passions = await prisma.passion.findMany({
      include: {
        parent: true,
        children: true,
        userPassions: includeUserPassions && session?.user ? {
          where: { userId: session.user.id },
        } : false,
        _count: {
          select: {
            userPassions: true,
            projects: true,
          },
        },
      },
      orderBy: [
        { isCustom: "asc" },
        { name: "asc" },
      ],
    });

    // If no passions exist, create default ones
    if (passions.length === 0) {
      const defaultPassions = [
        { name: "Art", slug: "art", description: "Creative visual expression", icon: "🎨", color: "#F97316" },
        { name: "Cooking", slug: "cooking", description: "Culinary adventures", icon: "👨‍🍳", color: "#F59E0B" },
        { name: "Writing", slug: "writing", description: "Words and stories", icon: "✍️", color: "#6B7280" },
        { name: "Music", slug: "music", description: "Playing and listening", icon: "🎵", color: "#EC4899" },
        { name: "Learning a Language", slug: "learning-a-language", description: "Expanding communication", icon: "🌍", color: "#3B82F6" },
        { name: "Gardening", slug: "gardening", description: "Growing plants and food", icon: "🌱", color: "#22C55E" },
        { name: "Studying", slug: "studying", description: "Academic pursuits", icon: "📚", color: "#8B5CF6" },
        { name: "Composing", slug: "composing", description: "Creating musical works", icon: "🎼", color: "#EF4444" },
      ];

      // Create default passions in database
      await prisma.passion.createMany({
        data: defaultPassions,
      });

      // Fetch the created passions
      passions = await prisma.passion.findMany({
        include: {
          parent: true,
          children: true,
          userPassions: includeUserPassions && session?.user ? {
            where: { userId: session.user.id },
          } : false,
          _count: {
            select: {
              userPassions: true,
              projects: true,
            },
          },
        },
        orderBy: [
          { isCustom: "asc" },
          { name: "asc" },
        ],
      });
    }

    // For onboarding (unauthenticated or simple format), return just the passion data
    if (!session?.user || searchParams.get("simple") === "true") {
      return NextResponse.json(passions);
    }

    return NextResponse.json({ passions });
  } catch (error) {
    console.error("Error fetching passions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, parentId, icon, color } = createPassionSchema.parse(body);

    // Generate slug and check for duplicates
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness by appending numbers if needed
    while (await prisma.passion.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await prisma.passion.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent passion not found" },
          { status: 404 }
        );
      }
    }

    // Create the new passion
    const passion = await prisma.passion.create({
      data: {
        name,
        slug,
        description,
        parentId,
        icon,
        color,
        isCustom: true,
      },
      include: {
        parent: true,
        _count: {
          select: {
            userPassions: true,
            projects: true,
          },
        },
      },
    });

    // Automatically add the creator as a user of this passion
    await prisma.userPassion.create({
      data: {
        userId: session.user.id,
        passionId: passion.id,
      },
    });

    return NextResponse.json({ passion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating passion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}