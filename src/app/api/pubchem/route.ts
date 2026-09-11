import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPubChemProfile, searchPubChemCandidates } from "@/lib/pubchem/client";
import { createServerSupabase } from "@/lib/supabase/server";

const querySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  cid: z.string().trim().regex(/^\d+$/).max(20).optional(),
  mode: z.enum(["profile", "candidates"]).default("profile")
}).refine((value) => Boolean(value.name || value.cid), {
  message: "Provide either name or cid"
});

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    name: searchParams.get("name") ?? undefined,
    cid: searchParams.get("cid") ?? undefined,
    mode: searchParams.get("mode") ?? "profile"
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter PubChem tidak valid. Gunakan name atau CID numerik." }, { status: 400 });
  }

  const { name, cid, mode } = parsed.data;

  try {
    if (mode === "candidates" && name) {
      const candidates = await searchPubChemCandidates(name);
      return NextResponse.json({ candidates });
    }
    const profile = await getPubChemProfile({ name, cid });
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("PubChem request failed", err);
    return NextResponse.json(
      { error: "PubChem request failed. Check network access to pubchem.ncbi.nlm.nih.gov." },
      { status: 502 }
    );
  }
}
