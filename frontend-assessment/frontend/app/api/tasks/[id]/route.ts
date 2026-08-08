import { NextResponse } from "next/server";
import {
  deleteTaskFromBackend,
  getTaskByIdFromBackend,
  updateTaskInBackend,
} from "@/lib/backendApi";
import { logTaskActivity } from "@/lib/logTaskActivity";
import type { PatchTaskRequest, TaskStatus } from "@/types/api";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const task = await getTaskByIdFromBackend(params.id);
    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch task.";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;

    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      completed?: boolean;
      status?: string;
    };

    if (
      payload.title === undefined &&
      payload.completed === undefined &&
      payload.status === undefined
    ) {
      return NextResponse.json(
        { error: { message: "nothing to update" } },
        { status: 400 },
      );
    }

    if (payload.title !== undefined && typeof payload.title !== "string") {
      return NextResponse.json(
        { error: { message: "title must be string" } },
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

    if (
      payload.status !== undefined &&
      !["todo", "in-progress", "done"].includes(payload.status)
    ) {
      return NextResponse.json(
        { error: { message: "status must be todo, in-progress, or done" } },
        { status: 400 },
      );
    }

    const updates: PatchTaskRequest = {};

    if (typeof payload.title === "string") {
      const trimmed = payload.title.trim();
      if (trimmed.length < 2) {
        return NextResponse.json(
          { error: { message: "Title is too short." } },
          { status: 400 },
        );
      }
      updates.title = trimmed;
    }

    if (payload.completed !== undefined) {
      updates.completed = payload.completed;
    }

    if (payload.status !== undefined) {
      updates.status = payload.status as TaskStatus;
    }

    const task = await updateTaskInBackend(params.id, updates);
    await logTaskActivity("task.updated", task.id);

    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update task.";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;

    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await deleteTaskFromBackend(params.id);
    await logTaskActivity("task.deleted", params.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete task.";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;

    return NextResponse.json({ error: { message } }, { status });
  }
}
