import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: "client_admin" | "client_member" | "newtonx_admin" | "expert";
  onboarding_complete: boolean;
};

export type ExpertProfile = {
  user_id: string;
  headline: string;
  credentials: string;
  expertise_tags: string[];
  industry_codes: string[];
  geography_codes: string[];
  seniority: string | null;
  bio: string | null;
  is_available: boolean;
};

export function isExpertRole(role: string) {
  return role === "expert";
}

export function homePathForRole(role: string) {
  return isExpertRole(role) ? "/expert/marketplace" : "/dashboard";
}

export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, role, onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

export async function getExpertProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ExpertProfile;
}
