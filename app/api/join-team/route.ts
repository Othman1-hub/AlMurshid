import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { projectId, projectName, password } = await request.json();

    if (
      projectId === undefined ||
      projectName === undefined ||
      password === undefined
    ) {
      return NextResponse.json(
        { message: "Missing projectId, projectName, or password" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const parsedProjectId = Number(projectId);
    if (Number.isNaN(parsedProjectId)) {
      return NextResponse.json(
        { message: "Invalid project ID format" },
        { status: 400 }
      );
    }

    const {
      data: projectRow,
      error: projectError,
    } = await supabase
      .from("projects")
      .select("id, name, password")
      .eq("id", parsedProjectId)
      .maybeSingle();

    if (projectError || !projectRow) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    if (projectRow.name !== projectName) {
      return NextResponse.json(
        { message: "Project name does not match ID" },
        { status: 400 }
      );
    }

    const storedPassword = (projectRow.password ?? "").trim();
    if (storedPassword !== (password ?? "").trim()) {
      return NextResponse.json(
        { message: "Password does not match" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("teams")
      .select("id")
      .eq("project_id", parsedProjectId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { message: "Failed to check existing membership" },
        { status: 500 }
      );
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("teams").insert([
        {
          project_id: parsedProjectId,
          user_id: user.id,
          role: 2,
        },
      ]);

      if (insertError) {
        const duplicate =
          insertError.code === "23505" ||
          insertError.message?.toLowerCase().includes("duplicate");
        return NextResponse.json(
          {
            message: duplicate
              ? "You are already a teammate on this project"
              : "Failed to join this project",
          },
          { status: duplicate ? 400 : 500 }
        );
      }
    }

    return NextResponse.json({ success: true, projectId: projectRow.id });
  } catch (err) {
    console.error("JOIN API error", err);
    return NextResponse.json(
      { message: "Failed to join this project (server error)" },
      { status: 500 }
    );
  }
}
