export type ReportGenerationProgress = {
  stage: string;
  message: string;
  progress: number;
};

export type ReportGenerationDone = {
  done: true;
  projectId: string;
  personaCount: number;
  sectionCount: number;
  source: string;
};

export type ReportGenerationError = {
  error: string;
};

export type ReportGenerationEvent = ReportGenerationProgress | ReportGenerationDone | ReportGenerationError;

export function isGenerationDone(event: ReportGenerationEvent): event is ReportGenerationDone {
  return "done" in event && event.done === true;
}

export function isGenerationError(event: ReportGenerationEvent): event is ReportGenerationError {
  return "error" in event;
}
