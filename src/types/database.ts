// Hand-written types mirroring supabase/schema.sql.
// If you change the schema, regenerate with:
//   supabase gen types typescript --project-id <id> > src/types/database.ts
// and merge any custom helper types back in.

export type UserRole = "super_admin" | "researcher" | "reviewer";
export type ConfidenceLevel = "high" | "medium" | "low";
export type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";
export type EvidenceSourceType =
  | "official_database"
  | "regulatory_guideline"
  | "peer_reviewed_paper"
  | "review_article"
  | "systematic_review"
  | "preprint"
  | "ai_inference";
export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_revision";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          institution: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: never[];
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          research_name: string;
          research_title: string;
          researcher_name: string | null;
          institution: string | null;
          target_api: string | null;
          dosage_form: string | null;
          route_of_administration: string | null;
          formulation_objective: string | null;
          therapeutic_target: string | null;
          research_year: number | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          owner_id: string;
          research_name: string;
          research_title: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: never[];
      };
      apis: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          generic_name: string | null;
          synonyms: string[] | null;
          cas_number: string | null;
          pubchem_cid: string | null;
          smiles_canonical: string | null;
          smiles_isomeric: string | null;
          inchi: string | null;
          inchikey: string | null;
          molecular_formula: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["apis"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["apis"]["Row"]>;
        Relationships: never[];
      };
      api_properties: {
        Row: {
          id: string;
          api_id: string;
          property_name: string;
          property_value: string | null;
          unit: string | null;
          condition_notes: string | null;
          is_predicted: boolean;
          source_name: string;
          source_url: string | null;
          confidence: ConfidenceLevel | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["api_properties"]["Row"]> & {
          api_id: string;
          property_name: string;
          source_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_properties"]["Row"]>;
        Relationships: never[];
      };
      literature: {
        Row: {
          id: string;
          api_id: string | null;
          project_id: string | null;
          title: string;
          authors: string[] | null;
          journal: string | null;
          publication_year: number | null;
          article_type: string | null;
          doi: string | null;
          url: string | null;
          abstract: string | null;
          is_open_access: boolean;
          source_id: string | null;
          external_id: string | null;
          retrieved_at: string;
          is_saved: boolean;
          notes: string | null;
          tags: string[] | null;
          created_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["literature"]["Row"]> & { title: string };
        Update: Partial<Database["public"]["Tables"]["literature"]["Row"]>;
        Relationships: never[];
      };
      literature_evidence: {
        Row: {
          id: string;
          literature_id: string;
          api_id: string | null;
          parameter: string;
          claim: string;
          value: string | null;
          unit: string | null;
          condition_notes: string | null;
          confidence: ConfidenceLevel;
          source_type: EvidenceSourceType;
          is_ai_inference: boolean;
          extracted_by: string;
          review_status: ReviewStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["literature_evidence"]["Row"]> & {
          literature_id: string;
          parameter: string;
          claim: string;
        };
        Update: Partial<Database["public"]["Tables"]["literature_evidence"]["Row"]>;
        Relationships: never[];
      };
      qtpp: {
        Row: {
          id: string;
          project_id: string;
          attribute: string;
          target: string;
          justification: string | null;
          source_evidence_id: string | null;
          ai_suggested: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["qtpp"]["Row"]> & {
          project_id: string;
          attribute: string;
          target: string;
        };
        Update: Partial<Database["public"]["Tables"]["qtpp"]["Row"]>;
        Relationships: never[];
      };
      cqa: {
        Row: {
          id: string;
          project_id: string;
          qtpp_id: string | null;
          attribute: string;
          target: string | null;
          importance: number;
          reason: string | null;
          evidence_id: string | null;
          ai_suggested: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cqa"]["Row"]> & {
          project_id: string;
          attribute: string;
        };
        Update: Partial<Database["public"]["Tables"]["cqa"]["Row"]>;
        Relationships: never[];
      };
      cma: {
        Row: {
          id: string;
          project_id: string;
          cqa_id: string | null;
          material: string;
          attribute: string;
          target: string | null;
          impact_description: string | null;
          evidence_id: string | null;
          ai_suggested: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cma"]["Row"]> & {
          project_id: string;
          material: string;
          attribute: string;
        };
        Update: Partial<Database["public"]["Tables"]["cma"]["Row"]>;
        Relationships: never[];
      };
      cpp: {
        Row: {
          id: string;
          project_id: string;
          process_step: string;
          parameter: string;
          target: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cpp"]["Row"]> & {
          project_id: string;
          process_step: string;
          parameter: string;
        };
        Update: Partial<Database["public"]["Tables"]["cpp"]["Row"]>;
        Relationships: never[];
      };
      risk_assessments: {
        Row: {
          id: string;
          project_id: string;
          cma_id: string | null;
          cqa_id: string | null;
          risk_factor: string;
          severity: number;
          occurrence: number;
          detectability: number;
          rpn: number;
          risk_level: RiskLevel;
          rationale: string | null;
          study_required: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["risk_assessments"]["Row"]> & {
          project_id: string;
          risk_factor: string;
          severity: number;
          occurrence: number;
          detectability: number;
        };
        Update: Partial<Database["public"]["Tables"]["risk_assessments"]["Row"]>;
        Relationships: never[];
      };
      excipients: {
        Row: { id: string; name: string; category: string | null; created_at: string };
        Insert: { id?: string; name: string; category?: string | null };
        Update: Partial<Database["public"]["Tables"]["excipients"]["Row"]>;
        Relationships: never[];
      };
      excipient_compatibility: {
        Row: {
          id: string;
          project_id: string;
          api_id: string;
          excipient_id: string;
          interaction_summary: string;
          risk: RiskLevel;
          evidence_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["excipient_compatibility"]["Row"]> & {
          project_id: string;
          api_id: string;
          excipient_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["excipient_compatibility"]["Row"]>;
        Relationships: never[];
      };
      preformulation_studies: {
        Row: {
          id: string;
          project_id: string;
          study_name: string;
          objective: string | null;
          why_needed: string | null;
          parameter: string | null;
          expected_output: string | null;
          related_cqa_id: string | null;
          related_cma_id: string | null;
          evidence_id: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["preformulation_studies"]["Row"]> & {
          project_id: string;
          study_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["preformulation_studies"]["Row"]>;
        Relationships: never[];
      };
      references_table: {
        Row: {
          id: string;
          project_id: string;
          literature_id: string | null;
          authors: string;
          year: number | null;
          title: string;
          journal: string | null;
          volume: string | null;
          issue: string | null;
          pages: string | null;
          doi: string | null;
          style: string;
          formatted_citation: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["references_table"]["Row"]> & {
          project_id: string;
          authors: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["references_table"]["Row"]>;
        Relationships: never[];
      };
      search_history: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          query: string;
          filters: Record<string, unknown> | null;
          api_name: string | null;
          result_count: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["search_history"]["Row"]> & {
          user_id: string;
          query: string;
        };
        Update: Partial<Database["public"]["Tables"]["search_history"]["Row"]>;
        Relationships: never[];
      };
      app_settings: {
        Row: {
          id: boolean;
          app_name: string;
          tagline: string;
          hero_headline: string;
          hero_body: string;
          color_primary: string;
          color_primary_dark: string;
          color_primary_soft: string;
          color_accent: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Relationships: never[];
      };
      doe_designs: {
        Row: {
          id: string;
          project_id: string;
          design_name: string;
          design_type: string | null;
          response_variable: string | null;
          factors: { name: string; unit?: string }[];
          runs: { run: number; values: Record<string, string> }[];
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["doe_designs"]["Row"]> & {
          project_id: string;
          design_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["doe_designs"]["Row"]>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
