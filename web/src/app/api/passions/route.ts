import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeUserPassions = searchParams.get("includeUserPassions") === "true";

    // Get all passions with optional user passion data
    const passions = await prisma.passion.findMany({
      include: {
        parent: true,
        children: true,
        userPassions: includeUserPassions ? {
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
    const session = await auth();
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