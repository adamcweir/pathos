import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const nextStepSchema = z.string().min(1);

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  nextSteps: z.array(nextStepSchema).min(1),
});

const passionDetailSchema = z.object({
  passionId: z.string(),
  specificArea: z.string().optional(),
  currentLevel: z.string().optional(),
  activeProjects: z.array(projectSchema),
});

const passionDetailsSchema = z.object({
  passionDetails: z.record(z.string(), passionDetailSchema),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { passionDetails } = passionDetailsSchema.parse(body);

    // Process each passion's details
    for (const [passionId, details] of Object.entries(passionDetails)) {
      // Verify user has this passion
      const userPassion = await prisma.userPassion.findUnique({
        where: {
          userId_passionId: {
            userId: session.user.id,
            passionId: passionId,
          },
        },
      });

      if (!userPassion) {
        continue; // Skip if user doesn't have this passion
      }

      // Create projects for this passion
      for (const projectData of details.activeProjects) {
        // Skip empty projects
        if (!projectData.title.trim()) continue;

        // Filter out empty next steps
        const validNextSteps = projectData.nextSteps.filter(step => step.trim().length > 0);
        
        if (validNextSteps.length === 0) continue;

        // Create the project
        const project = await prisma.project.create({
          data: {
            title: projectData.title,
            description: projectData.description || null,
            userId: session.user.id,
            passionId: passionId,
            status: "active",
            stage: "planning",
          },
        });

        // Create initial milestone for next steps
        const milestone = await prisma.milestone.create({
          data: {
            title: "Next Steps",
            description: `Initial steps for ${projectData.title}`,
            userId: session.user.id,
            projectId: project.id,
            status: "planned",
            order: 0,
          },
        });

        // Create tasks for each next step
        for (let i = 0; i < validNextSteps.length; i++) {
          await prisma.task.create({
            data: {
              title: validNextSteps[i],
              userId: session.user.id,
              projectId: project.id,
              milestoneId: milestone.id,
              order: i,
            },
          });
        }

        // Add user notes as entries if specific area or level was provided
        if (details.specificArea || details.currentLevel) {
          const noteContent = [
            details.specificArea && `Specific focus: ${details.specificArea}`,
            details.currentLevel && `Current level: ${details.currentLevel.charAt(0).toUpperCase() + details.currentLevel.slice(1)}`,
          ]
            .filter(Boolean)
            .join('\n');

          if (noteContent) {
            await prisma.entry.create({
              data: {
                title: "Project Notes",
                content: noteContent,
                type: "note",
                userId: session.user.id,
                projectId: project.id,
                publishedAt: new Date(),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving passion details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}