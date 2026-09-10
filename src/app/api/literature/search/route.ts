import { NextRequest, NextResponse } from "next/server";
import { searchLiterature } from "@/lib/literature/aggregator";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    query,
    projectId,
    yearFrom,
    yearTo,
    onlyOpenAccess,
    onlyRecent,
    includeClassic,
    articleType
  } = body ?? {};

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "`query` is required" }, { status: 400 });
  }

  try {
    const result = await searchLiterature(query, {
      yearFrom,
      yearTo,
      onlyOpenAccess,
      onlyRecent,
      includeClassic,
      articleType
    });

    // Fire-and-forget search history log — never blocks the response.
    supabase
      .from("search_history")
      .insert({
        user_id: user.id,
        project_id: projectId ?? null,
        query,
        filters: { yearFrom, yearTo, onlyOpenAccess, onlyRecent, includeClassic, articleType },
        result_count: result.papers.length
      })
      .then(() => {});

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Literature search failed." }, { status: 502 });
  }
}
