import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().optional(),
  type: z.enum(["progress", "milestone", "note", "media", "link"]).default("progress"),
  privacy: z.enum(["private", "friends", "public"]).default("public"),
  projectId: z.string().min(1, "Project ID is required"),
  milestoneId: z.string().optional(),
  mediaUrls: z.array(z.string().url()).default([]),
  links: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().optional(),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  type: z.enum(["progress", "milestone", "note", "media", "link"]).optional(),
  published: z.string().transform(val => val === "true").optional(),
  limit: z.string().transform(val => parseInt(val) || 20).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEntrySchema.parse(body);

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

    // If milestoneId provided, verify it belongs to the project
    if (validatedData.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { 
          id: validatedData.milestoneId, 
          projectId: validatedData.projectId,
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

    const entry = await prisma.entry.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        privacy: validatedData.privacy,
        userId: token.sub,
        projectId: validatedData.projectId,
        milestoneId: validatedData.milestoneId,
        mediaUrls: validatedData.mediaUrls,
        links: validatedData.links,
        tags: validatedData.tags,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date(),
      },
      include: {
        user: {
          select: { username: true, name: true }
        },
        project: {
          select: { title: true }
        },
        milestone: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating entry:", error);
    
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

    if (query.milestoneId) {
      whereClause.milestoneId = query.milestoneId;
    }

    if (query.type) {
      whereClause.type = query.type;
    }

    if (query.published !== undefined) {
      if (query.published) {
        whereClause.publishedAt = { not: null };
      } else {
        whereClause.publishedAt = null;
      }
    }

    const entries = await prisma.entry.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" }
      ],
      take: query.limit,
      skip: query.offset,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    
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