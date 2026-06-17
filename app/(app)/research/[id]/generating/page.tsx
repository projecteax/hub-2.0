import { ReportGenerationRunner } from "@/components/report-generation-runner";

export default async function ResearchGeneratingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ReportGenerationRunner
      projectId={id}
      redirectTo={`/research/${id}/report`}
      autostart
      title="Building your expert research report"
      subtitle="Each research question is answered by every expert before synthesis."
    />
  );
}
