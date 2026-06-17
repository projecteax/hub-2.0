import type { VirtualExpertPersona, VirtualExpertResponse } from "@/lib/research/report-types";

const ORG_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function anonymizedOrganizationLabel(index: number, segment: string, companySizeBand: string) {
  const letter = ORG_LABELS[index] ?? String(index + 1);
  return `Anonymized Org ${letter} · ${segment} · ${companySizeBand}`;
}

export function anonymizePersona(persona: VirtualExpertPersona, index: number): VirtualExpertPersona {
  const originalOrg = persona.organization;
  const anonymized = anonymizedOrganizationLabel(index, persona.segment, persona.companySizeBand);

  return {
    ...persona,
    organization: anonymized,
    bio: scrubOrganizationNames(persona.bio ?? "", originalOrg ? [originalOrg] : [])
  };
}

export function scrubOrganizationNames(text: string, namesToRemove: string[]) {
  let cleaned = text;
  for (const name of namesToRemove.filter((name) => name.length >= 3)) {
    cleaned = cleaned.split(name).join("my organization");
  }
  return cleaned
    .replace(/\b(at|from)\s+[A-Z][A-Za-z0-9&.\-\s]{2,40}\b/g, "at my organization")
    .replace(/\b(our company|our firm|our organization)\b/gi, "my organization");
}

export function anonymizeExpertPanel(
  personas: VirtualExpertPersona[],
  responses: VirtualExpertResponse[]
): { personas: VirtualExpertPersona[]; responses: VirtualExpertResponse[] } {
  const originalOrgById = new Map(personas.map((persona) => [persona.id, persona.organization ?? ""]));
  const anonymizedPersonas = personas.map((persona, index) => anonymizePersona(persona, index));

  const anonymizedResponses = responses.map((response) => {
    const originalOrg = originalOrgById.get(response.personaId) ?? "";
    const names = [originalOrg, ...personas.map((p) => p.organization ?? "")].filter(Boolean);

    return {
      ...response,
      openAnswer: response.openAnswer ? scrubOrganizationNames(response.openAnswer, names) : undefined,
      reasoningSummary: scrubOrganizationNames(response.reasoningSummary, names)
    };
  });

  return { personas: anonymizedPersonas, responses: anonymizedResponses };
}
