import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addPassionSchema = z.object({
  passionId: z.string(),
});

const addMultiplePassionsSchema = z.object({
  passionIds: z.array(z.string()),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's passions with related data
    const userPassions = await prisma.userPassion.findMany({
      where: { userId: session.user.id },
      include: {
        passion: {
          include: {
            parent: true,
            children: true,
            _count: {
              select: {
                projects: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
      orderBy: {
        passion: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({ userPassions });
  } catch (error) {
    console.error("Error fetching user passions:", error);
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

    // Support both single passion and multiple passions
    if (body.passionIds && Array.isArray(body.passionIds)) {
      // Handle multiple passions (for onboarding)
      const { passionIds } = addMultiplePassionsSchema.parse(body);

      // Remove existing user passions
      await prisma.userPassion.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      // Add new user passions
      if (passionIds.length > 0) {
        const userPassions = passionIds.map((passionId) => ({
          userId: session.user.id,
          passionId: passionId,
        }));

        await prisma.userPassion.createMany({
          data: userPassions,
        });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      // Handle single passion (existing functionality)
      const { passionId } = addPassionSchema.parse(body);

      // Verify passion exists
      const passion = await prisma.passion.findUnique({
        where: { id: passionId },
      });

      if (!passion) {
        return NextResponse.json(
          { error: "Passion not found" },
          { status: 404 }
        );
      }

      // Check if user already has this passion
      const existingUserPassion = await prisma.userPassion.findUnique({
        where: {
          userId_passionId: {
            userId: session.user.id,
            passionId,
          },
        },
      });

      if (existingUserPassion) {
        return NextResponse.json(
          { error: "User already has this passion" },
          { status: 409 }
        );
      }

      // Add passion to user
      const userPassion = await prisma.userPassion.create({
        data: {
          userId: session.user.id,
          passionId,
        },
        include: {
          passion: {
            include: {
              parent: true,
              children: true,
            },
          },
        },
      });

      return NextResponse.json({ userPassion }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error adding user passion(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const passionId = searchParams.get("passionId");

    if (!passionId) {
      return NextResponse.json(
        { error: "passionId is required" },
        { status: 400 }
      );
    }

    // Delete user passion relationship
    const deleted = await prisma.userPassion.deleteMany({
      where: {
        userId: session.user.id,
        passionId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "User passion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing user passion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}