import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateMilestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  status: z.enum(["planned", "active", "completed", "skipped"]).optional(),
  parentId: z.string().optional(),
  targetDate: z.string().datetime().optional(),
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

    const milestone = await prisma.milestone.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      },
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        parent: {
          select: { id: true, title: true, status: true }
        },
        children: {
          select: { id: true, title: true, status: true, completedAt: true, targetDate: true },
          orderBy: { order: "asc" }
        },
        entries: {
          select: { 
            id: true, 
            title: true, 
            type: true, 
            publishedAt: true,
            content: true
          },
          orderBy: { publishedAt: "desc" }
        },
        tasks: {
          select: { 
            id: true, 
            title: true, 
            completed: true, 
            completedAt: true,
            dueDate: true,
            description: true
          },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" }, 
        { status: 404 }
      );
    }

    // Calculate progress
    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(task => task.completed).length;
    const totalChildren = milestone.children.length;
    const completedChildren = milestone.children.filter(child => child.status === "completed").length;
    
    const milestoneWithProgress = {
      ...milestone,
      progress: {
        tasks: { completed: completedTasks, total: totalTasks },
        children: { completed: completedChildren, total: totalChildren }
      }
    };

    return NextResponse.json(milestoneWithProgress);
  } catch (error) {
    console.error("Error fetching milestone:", error);
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
    const validatedData = updateMilestoneSchema.parse(body);

    // Check if milestone exists and belongs to user
    const existingMilestone = await prisma.milestone.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      }
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found" }, 
        { status: 404 }
      );
    }

    // If parentId is being updated, verify it belongs to the same project
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        const parentMilestone = await prisma.milestone.findFirst({
          where: { 
            id: validatedData.parentId, 
            projectId: existingMilestone.projectId,
            userId: token.sub
          }
        });

        if (!parentMilestone) {
          return NextResponse.json(
            { error: "Parent milestone not found or unauthorized" }, 
            { status: 404 }
          );
        }

        // Prevent circular references
        if (validatedData.parentId === params.id) {
          return NextResponse.json(
            { error: "Milestone cannot be its own parent" }, 
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      
      // Set completedAt timestamp when marking as completed
      if (validatedData.status === "completed" && existingMilestone.status !== "completed") {
        updateData.completedAt = new Date();
      } else if (validatedData.status !== "completed") {
        updateData.completedAt = null;
      }
    }
    if (validatedData.parentId !== undefined) updateData.parentId = validatedData.parentId;
    if (validatedData.targetDate !== undefined) {
      updateData.targetDate = validatedData.targetDate ? new Date(validatedData.targetDate) : null;
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const updatedMilestone = await prisma.milestone.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true, passion: { select: { name: true } } }
        },
        parent: {
          select: { id: true, title: true, status: true }
        },
        children: {
          select: { id: true, title: true, status: true, completedAt: true },
          orderBy: { order: "asc" }
        },
        entries: {
          select: { id: true, title: true, type: true, publishedAt: true },
          orderBy: { publishedAt: "desc" },
          take: 5
        },
        tasks: {
          select: { id: true, title: true, completed: true, completedAt: true },
          orderBy: { order: "asc" }
        }
      }
    });

    // Calculate progress
    const totalTasks = updatedMilestone.tasks.length;
    const completedTasks = updatedMilestone.tasks.filter(task => task.completed).length;
    const totalChildren = updatedMilestone.children.length;
    const completedChildren = updatedMilestone.children.filter(child => child.status === "completed").length;
    
    const milestoneWithProgress = {
      ...updatedMilestone,
      progress: {
        tasks: { completed: completedTasks, total: totalTasks },
        children: { completed: completedChildren, total: totalChildren }
      }
    };

    return NextResponse.json(milestoneWithProgress);
  } catch (error) {
    console.error("Error updating milestone:", error);
    
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

    // Check if milestone exists and belongs to user
    const existingMilestone = await prisma.milestone.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      },
      include: {
        children: { select: { id: true } },
        entries: { select: { id: true } },
        tasks: { select: { id: true } }
      }
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found" }, 
        { status: 404 }
      );
    }

    // Check if milestone has children - if so, we need to handle them
    if (existingMilestone.children.length > 0) {
      // Update children to have no parent (make them top-level)
      await prisma.milestone.updateMany({
        where: { parentId: params.id },
        data: { parentId: null }
      });
    }

    // Update entries to remove milestone reference
    if (existingMilestone.entries.length > 0) {
      await prisma.entry.updateMany({
        where: { milestoneId: params.id },
        data: { milestoneId: null }
      });
    }

    // Update tasks to remove milestone reference
    if (existingMilestone.tasks.length > 0) {
      await prisma.task.updateMany({
        where: { milestoneId: params.id },
        data: { milestoneId: null }
      });
    }

    await prisma.milestone.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}