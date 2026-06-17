import type { ExpertProfile } from "@/lib/auth/profile";

export type ProjectMatchContext = {
  industryCode: string;
  geographyCode: string;
  marketSegment: string;
  expertiseTags: string[];
};

export type ScoredExpert = ExpertProfile & {
  userId: string;
  email: string;
  fullName: string | null;
  matchScore: number;
};

function overlapScore(projectValues: string[], expertValues: string[]) {
  if (projectValues.length === 0 || expertValues.length === 0) return 0;
  const expertSet = new Set(expertValues.map((v) => v.toLowerCase()));
  const hits = projectValues.filter((v) => expertSet.has(v.toLowerCase())).length;
  return hits / Math.max(projectValues.length, 1);
}

export function scoreExpertForProject(expert: ExpertProfile, context: ProjectMatchContext) {
  const industryScore = context.industryCode
    ? expert.industry_codes.includes(context.industryCode)
      ? 1
      : overlapScore([context.industryCode], expert.industry_codes) * 0.5
    : 0;

  const geoScore = context.geographyCode
    ? expert.geography_codes.includes(context.geographyCode) ||
      expert.geography_codes.includes("GLOBAL")
      ? 1
      : overlapScore([context.geographyCode], expert.geography_codes) * 0.5
    : 0;

  const tagHaystack = [
    ...expert.expertise_tags,
    expert.headline,
    expert.bio ?? "",
    context.marketSegment
  ]
    .join(" ")
    .toLowerCase();

  const tagScore = context.expertiseTags.some((tag) => tagHaystack.includes(tag.toLowerCase())) ? 0.6 : 0;

  const marketScore = context.marketSegment
    ? tagHaystack.includes(context.marketSegment.toLowerCase())
      ? 0.8
      : 0
    : 0;

  return Math.round((industryScore * 40 + geoScore * 30 + tagScore * 15 + marketScore * 15) * 100) / 100;
}

export function pickTopExperts(
  experts: ScoredExpert[],
  context: ProjectMatchContext,
  limit = 3
): ScoredExpert[] {
  const scored = experts
    .filter((e) => e.is_available)
    .map((expert) => ({
      ...expert,
      matchScore: scoreExpertForProject(expert, context)
    }))
    .filter((e) => e.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (scored.length >= limit) {
    return scored.slice(0, limit);
  }

  const fallback = experts
    .filter((e) => e.is_available && !scored.some((s) => s.userId === e.userId))
    .map((expert) => ({ ...expert, matchScore: 10 }))
    .slice(0, limit - scored.length);

  return [...scored, ...fallback];
}
