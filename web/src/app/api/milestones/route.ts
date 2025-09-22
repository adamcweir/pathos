import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project ID is required"),
  parentId: z.string().optional(),
  targetDate: z.string().datetime().optional(),
  order: z.number().int().min(0).default(0),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(["planned", "active", "completed", "skipped"]).optional(),
  parentId: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMilestoneSchema.parse(body);

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: { 
        id: validatedData.projectId, 
        userId: token.sub 
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" }, 
        { status: 404 }
      );
    }

    // If parentId provided, verify it belongs to the same project
    if (validatedData.parentId) {
      const parentMilestone = await prisma.milestone.findFirst({
        where: { 
          id: validatedData.parentId, 
          projectId: validatedData.projectId,
          userId: token.sub
        }
      });

      if (!parentMilestone) {
        return NextResponse.json(
          { error: "Parent milestone not found or unauthorized" }, 
          { status: 404 }
        );
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        userId: token.sub,
        projectId: validatedData.projectId,
        parentId: validatedData.parentId,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        order: validatedData.order,
      },
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true }
        },
        parent: {
          select: { id: true, title: true }
        },
        children: {
          select: { id: true, title: true, status: true },
          orderBy: { order: "asc" }
        },
        entries: {
          select: { id: true, title: true, type: true, publishedAt: true },
          orderBy: { publishedAt: "desc" },
          take: 3
        },
        tasks: {
          select: { id: true, title: true, completed: true },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const whereClause: any = {
      userId: token.sub,
    };

    if (query.projectId) {
      whereClause.projectId = query.projectId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.parentId !== undefined) {
      whereClause.parentId = query.parentId || null;
    }

    const milestones = await prisma.milestone.findMany({
      where: whereClause,
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        parent: {
          select: { id: true, title: true }
        },
        children: {
          select: { id: true, title: true, status: true, completedAt: true },
          orderBy: { order: "asc" }
        },
        entries: {
          select: { id: true, title: true, type: true, publishedAt: true },
          orderBy: { publishedAt: "desc" },
          take: 3
        },
        tasks: {
          select: { id: true, title: true, completed: true, completedAt: true },
          orderBy: { order: "asc" }
        }
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" }
      ],
      take: query.limit,
      skip: query.offset,
    });

    // Add progress calculation for each milestone
    const milestonesWithProgress = milestones.map(milestone => {
      const totalTasks = milestone.tasks.length;
      const completedTasks = milestone.tasks.filter(task => task.completed).length;
      const totalChildren = milestone.children.length;
      const completedChildren = milestone.children.filter(child => child.status === "completed").length;
      
      return {
        ...milestone,
        progress: {
          tasks: { completed: completedTasks, total: totalTasks },
          children: { completed: completedChildren, total: totalChildren }
        }
      };
    });

    return NextResponse.json(milestonesWithProgress);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}