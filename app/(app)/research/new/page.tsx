import { ResearchWizard } from "@/components/research-wizard";
import { PageHeader } from "@/components/ui/page-shell";

export default function NewResearchPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="New research"
        title="Launch a study"
        description="Scope your market, add questions, refine your brief, then accept to generate your expert report."
      />
      <ResearchWizard />
    </div>
  );
}
