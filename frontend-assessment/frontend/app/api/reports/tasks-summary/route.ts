import { NextResponse } from "next/server";
import { getTasksSummaryFromBackend } from "@/lib/backendApi";

export async function GET() {
  try {
    const summary = await getTasksSummaryFromBackend();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Unable to fetch tasks summary.",
        },
      },
      { status: 500 },
    );
  }
}
