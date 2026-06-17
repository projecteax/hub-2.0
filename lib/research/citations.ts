import type { Citation, WebResearchSource } from "@/lib/research/report-types";
import type { ResearchReport } from "@/lib/research/report-types";

export function verifiedSourceUrls(sources: WebResearchSource[]): Set<string> {
  return new Set(sources.filter((source) => source.verified && source.url).map((source) => source.url));
}

export function sanitizeCitation(citation: Citation, allowedUrls: Set<string>): Citation {
  if (!citation.url) {
    return citation;
  }

  if (allowedUrls.has(citation.url)) {
    return citation;
  }

  return {
    label: citation.label,
    sourceType: citation.sourceType === "web_research" ? "ai_synthesis" : citation.sourceType
  };
}

export function sanitizeCitations(citations: Citation[] | undefined, allowedUrls: Set<string>): Citation[] {
  return (citations ?? []).map((citation) => sanitizeCitation(citation, allowedUrls));
}

export function isDisplayableWebUrl(url: string | undefined, allowedUrls: Set<string>): boolean {
  return Boolean(url && allowedUrls.has(url));
}

export function sanitizeResearchReport(report: ResearchReport): ResearchReport {
  const allowedUrls = verifiedSourceUrls(report.webSources);

  return {
    ...report,
    webSources: report.webSources.filter((source) => source.verified && source.url),
    responses: report.responses.map((response) => ({
      ...response,
      citations: sanitizeCitations(response.citations, allowedUrls)
    })),
    sections: report.sections.map((section) => ({
      ...section,
      citations: sanitizeCitations(section.citations, allowedUrls)
    }))
  };
}
