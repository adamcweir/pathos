import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ProjectStatus, ProjectStage, PrivacyLevel } from "@prisma/client";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  passionId: z.string(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.active),
  stage: z.nativeEnum(ProjectStage).default(ProjectStage.idea),
  privacy: z.nativeEnum(PrivacyLevel).default(PrivacyLevel.public),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ProjectStatus | null;
    const passionId = searchParams.get("passionId");
    const userId = searchParams.get("userId") || session.user.id;

    // Build where clause
    const where: any = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (passionId) {
      where.passionId = passionId;
    }

    // Privacy filter: if not viewing own projects, only show public ones
    if (userId !== session.user.id) {
      where.privacy = PrivacyLevel.public;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        passion: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
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
    const { title, description, passionId, status, stage, privacy, startDate, endDate } = 
      createProjectSchema.parse(body);

    // Verify passion exists and user has access to it
    const passion = await prisma.passion.findUnique({
      where: { id: passionId },
    });

    if (!passion) {
      return NextResponse.json(
        { error: "Passion not found" },
        { status: 404 }
      );
    }

    // Check if user has this passion (for custom passions)
    if (passion.isCustom) {
      const userPassion = await prisma.userPassion.findUnique({
        where: {
          userId_passionId: {
            userId: session.user.id,
            passionId,
          },
        },
      });

      if (!userPassion) {
        return NextResponse.json(
          { error: "You must add this passion to your interests first" },
          { status: 403 }
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        passionId,
        userId: session.user.id,
        status,
        stage,
        privacy,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        passion: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}