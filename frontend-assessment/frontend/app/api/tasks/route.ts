import { NextResponse } from "next/server";
import { createTaskInBackend, getTasksFromBackend } from "@/lib/backendApi";
import { logTaskActivity } from "@/lib/logTaskActivity";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Unable to fetch tasks.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      completed?: boolean;
    };

    if (typeof payload.title !== "string" || !payload.title.trim()) {
      return NextResponse.json(
        { error: { message: "title is required and must be non-empty" } },
        { status: 400 },
      );
    }

    if (
      payload.completed !== undefined &&
      typeof payload.completed !== "boolean"
    ) {
      return NextResponse.json(
        { error: { message: "completed must be boolean" } },
        { status: 400 },
      );
    }

    const task = await createTaskInBackend({
      title: payload.title.trim(),
      completed: payload.completed,
    });

    await logTaskActivity("task.created", task.id);

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Unable to create task.",
        },
      },
      { status: 500 },
    );
  }
}
