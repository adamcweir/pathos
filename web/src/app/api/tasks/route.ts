import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).default(0),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  milestoneId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).optional(),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  completed: z.string().transform(val => val === "true").optional(),
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
    const validatedData = createTaskSchema.parse(body);

    // Verify user owns the project (if provided)
    if (validatedData.projectId) {
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
    }

    // Verify milestone belongs to the project and user (if provided)
    if (validatedData.milestoneId) {
      const whereClause: any = { 
        id: validatedData.milestoneId,
        userId: token.sub
      };

      // If projectId is provided, ensure milestone belongs to that project
      if (validatedData.projectId) {
        whereClause.projectId = validatedData.projectId;
      }

      const milestone = await prisma.milestone.findFirst({
        where: whereClause
      });

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found or unauthorized" }, 
          { status: 404 }
        );
      }

      // If no projectId provided but milestone found, use milestone's project
      if (!validatedData.projectId) {
        validatedData.projectId = milestone.projectId;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        userId: token.sub,
        projectId: validatedData.projectId,
        milestoneId: validatedData.milestoneId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        order: validatedData.order,
      },
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        milestone: {
          select: { title: true, status: true }
        }
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    
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

    if (query.milestoneId !== undefined) {
      whereClause.milestoneId = query.milestoneId || null;
    }

    if (query.completed !== undefined) {
      whereClause.completed = query.completed;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        milestone: {
          select: { title: true, status: true, targetDate: true }
        }
      },
      orderBy: [
        { completed: "asc" }, // Incomplete tasks first
        { order: "asc" },
        { createdAt: "asc" }
      ],
      take: query.limit,
      skip: query.offset,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    
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

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Verify user owns the task
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId: token.sub }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    // If milestoneId is being updated, verify ownership
    if (validatedData.milestoneId !== undefined && validatedData.milestoneId !== null) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: validatedData.milestoneId,
          userId: token.sub
        }
      });

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
      updateData.completedAt = validatedData.completed ? new Date() : null;
    }
    if (validatedData.milestoneId !== undefined) updateData.milestoneId = validatedData.milestoneId;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        milestone: {
          select: { title: true, status: true }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);

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