import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      },
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { 
            title: true, 
            passion: { select: { name: true } },
            status: true,
            stage: true
          }
        },
        milestone: {
          select: { 
            title: true, 
            status: true, 
            targetDate: true,
            completedAt: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" }, 
        { status: 404 }
      );
    }

    // Verify project ownership if projectId is being updated
    if (validatedData.projectId !== undefined) {
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
    }

    // Verify milestone ownership if milestoneId is being updated
    if (validatedData.milestoneId !== undefined) {
      if (validatedData.milestoneId) {
        const whereClause: any = { 
          id: validatedData.milestoneId,
          userId: token.sub
        };

        // If projectId is provided, ensure milestone belongs to that project
        const projectId = validatedData.projectId || existingTask.projectId;
        if (projectId) {
          whereClause.projectId = projectId;
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
      }
    }

    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
      
      // Set/unset completedAt timestamp
      if (validatedData.completed && !existingTask.completed) {
        updateData.completedAt = new Date();
      } else if (!validatedData.completed && existingTask.completed) {
        updateData.completedAt = null;
      }
    }
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.milestoneId !== undefined) updateData.milestoneId = validatedData.milestoneId;
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { 
            title: true, 
            passion: { select: { name: true } },
            status: true,
            stage: true
          }
        },
        milestone: {
          select: { 
            title: true, 
            status: true, 
            targetDate: true,
            completedAt: true
          }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" }, 
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}