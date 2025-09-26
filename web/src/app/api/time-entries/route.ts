import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createTimeEntrySchema = z.object({
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration cannot exceed 24 hours"),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
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
    const validatedData = createTimeEntrySchema.parse(body);

    // Validate start/end times
    const startedAt = new Date(validatedData.startedAt);
    const endedAt = new Date(validatedData.endedAt);

    if (endedAt <= startedAt) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Calculate duration if not provided (as backup)
    const calculatedDuration = Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60));
    const finalDuration = validatedData.duration || calculatedDuration;

    // Verify user owns the associated entities
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: validatedData.projectId, userId: token.sub }
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    if (validatedData.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: validatedData.taskId, userId: token.sub }
      });
      if (!task) {
        return NextResponse.json(
          { error: "Task not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    if (validatedData.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { id: validatedData.milestoneId, userId: token.sub }
      });
      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: validatedData.description,
        duration: finalDuration,
        userId: token.sub,
        projectId: validatedData.projectId,
        taskId: validatedData.taskId,
        milestoneId: validatedData.milestoneId,
        startedAt,
        endedAt,
      },
      include: {
        user: {
          select: { name: true, username: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true, icon: true } } }
        },
        task: {
          select: { title: true }
        },
        milestone: {
          select: { title: true, status: true }
        }
      }
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);

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

    if (query.taskId) {
      whereClause.taskId = query.taskId;
    }

    if (query.milestoneId) {
      whereClause.milestoneId = query.milestoneId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, username: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true, icon: true } } }
        },
        task: {
          select: { title: true }
        },
        milestone: {
          select: { title: true, status: true }
        }
      },
      orderBy: { startedAt: "desc" },
      take: query.limit,
      skip: query.offset,
    });

    // Calculate total time
    const totalTime = timeEntries.reduce((total, entry) => total + entry.duration, 0);

    return NextResponse.json({
      timeEntries,
      totalTime,
      count: timeEntries.length
    });
  } catch (error) {
    console.error("Error fetching time entries:", error);

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