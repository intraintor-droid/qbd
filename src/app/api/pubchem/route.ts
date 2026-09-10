import { NextRequest, NextResponse } from "next/server";
import { getPubChemProfile, searchPubChemCandidates } from "@/lib/pubchem/client";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? undefined;
  const cid = searchParams.get("cid") ?? undefined;
  const mode = searchParams.get("mode") ?? "profile"; // profile | candidates

  if (!name && !cid) {
    return NextResponse.json({ error: "Provide either ?name= or ?cid=" }, { status: 400 });
  }

  try {
    if (mode === "candidates" && name) {
      const candidates = await searchPubChemCandidates(name);
      return NextResponse.json({ candidates });
    }
    const profile = await getPubChemProfile({ name, cid });
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: "PubChem request failed. Check network access to pubchem.ncbi.nlm.nih.gov." },
      { status: 502 }
    );
  }
}
