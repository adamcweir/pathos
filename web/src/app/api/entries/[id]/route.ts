import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  content: z.string().optional(),
  type: z.enum(["progress", "milestone", "note", "media", "link"]).optional(),
  privacy: z.enum(["private", "friends", "public"]).optional(),
  milestoneId: z.string().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  links: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().datetime().optional(),
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

    const entry = await prisma.entry.findFirst({
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
        milestone: {
          select: { title: true, status: true, targetDate: true }
        }
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching entry:", error);
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
    const validatedData = updateEntrySchema.parse(body);

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Entry not found" }, 
        { status: 404 }
      );
    }

    // If milestoneId is being updated, verify it belongs to the same project
    if (validatedData.milestoneId !== undefined) {
      if (validatedData.milestoneId) {
        const milestone = await prisma.milestone.findFirst({
          where: { 
            id: validatedData.milestoneId, 
            projectId: existingEntry.projectId,
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
    }

    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.privacy !== undefined) updateData.privacy = validatedData.privacy;
    if (validatedData.milestoneId !== undefined) updateData.milestoneId = validatedData.milestoneId;
    if (validatedData.mediaUrls !== undefined) updateData.mediaUrls = validatedData.mediaUrls;
    if (validatedData.links !== undefined) updateData.links = validatedData.links;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.publishedAt !== undefined) {
      updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : null;
    }

    const updatedEntry = await prisma.entry.update({
      where: { id: params.id },
      data: updateData,
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
      }
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating entry:", error);
    
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

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: { 
        id: params.id,
        userId: token.sub
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Entry not found" }, 
        { status: 404 }
      );
    }

    await prisma.entry.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}