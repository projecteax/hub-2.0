export const industries = [
  { code: "NAICS-541511", label: "Enterprise Software and SaaS" },
  { code: "NAICS-52", label: "Financial Services" },
  { code: "NAICS-31-33", label: "Industrial Manufacturing" },
  { code: "NAICS-62", label: "Healthcare and Life Sciences" },
  { code: "NAICS-51", label: "Telecommunications and Media" },
  { code: "NAICS-44-45", label: "Retail and Consumer Goods" }
];

export const geographies = [
  { code: "GLOBAL", label: "Global" },
  { code: "NA", label: "North America" },
  { code: "EU", label: "Europe" },
  { code: "DACH", label: "DACH" },
  { code: "UKI", label: "United Kingdom and Ireland" },
  { code: "APAC", label: "Asia-Pacific" }
];

export const companySizeBands = [
  "50-249 employees",
  "250-999 employees",
  "1000-4999 employees",
  "5000-9999 employees",
  "10000+ employees"
];

/** Labels and help copy for the research scope intake form. */
export const scopeFieldLabels = {
  companySize: "Target company size",
  companySizeHelp:
    "Employee band for the organizations you want represented in the expert panel — not your own company's size.",
  audience: "Target audience",
  audienceHelp: "Roles and seniority of the experts or buyers you want the research to reflect.",
  market: "Market or product category",
  geography: "Target geography",
  industry: "Target industry"
} as const;

export const decisionStakes = [
  "internal planning",
  "executive readout",
  "board-level decision",
  "client-facing consulting deliverable",
  "regulated or compliance-sensitive use"
];

export const researchTypes = [
  "market adoption",
  "competitive intelligence",
  "buyer satisfaction",
  "vendor selection",
  "pricing and packaging",
  "thought leadership validation"
];
