"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { BriefReview } from "@/components/brief-editor";
import { Badge } from "@/components/ui/badge";
import { Field, SelectInput, TextInput } from "@/components/ui/page-shell";
import { WizardShell } from "@/components/wizard-shell";
import type { FollowUpSuggestion } from "@/lib/ai/follow-ups";
import type { AdaptiveQuestion, ResearchBrief, ResearchScope } from "@/lib/types";
import { industries, geographies, companySizeBands, decisionStakes, researchTypes, scopeFieldLabels } from "@/lib/standards";

type WizardStep = "scope" | "questions" | "adaptive" | "follow_ups" | "brief";

const STEPS: Array<{ id: WizardStep; label: string; description: string }> = [
  { id: "scope", label: "Scope", description: "Market & audience" },
  { id: "questions", label: "Questions", description: "What to learn" },
  { id: "adaptive", label: "Clarifiers", description: "Guided intake" },
  { id: "follow_ups", label: "Follow-ups", description: "Refine scope" },
  { id: "brief", label: "Brief", description: "Review & run" }
];

function defaultScope(): ResearchScope {
  return {
    industry: industries[0].label,
    industryCode: industries[0].code,
    market: "",
    geography: geographies[0].label,
    geographyCode: geographies[0].code,
    companySize: companySizeBands[0],
    audience: "",
    decisionStakes: decisionStakes[0],
    timeline: "next 12 months",
    researchType: researchTypes[0]
  };
}

export function ResearchWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("scope");
  const [scope, setScope] = useState<ResearchScope>(defaultScope);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<AdaptiveQuestion | null>(null);
  const [adaptiveAnswer, setAdaptiveAnswer] = useState("");
  const [adaptiveComplete, setAdaptiveComplete] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUpSuggestion[]>([]);
  const [editingAcceptedId, setEditingAcceptedId] = useState<string | null>(null);
  const [briefResponse, setBriefResponse] = useState<{
    brief: ResearchBrief;
    source: "google_ai" | "deterministic_fallback";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const pendingFollowUps = followUps.filter((item) => item.status === "pending");
  const acceptedFollowUps = followUps.filter((item) => item.status === "accepted" || item.status === "edited");

  function updateQuestion(index: number, value: string) {
    setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addQuestion() {
    if (questions.length >= 10) return;
    setQuestions((current) => [...current, ""]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function continueFromScope() {
    setError(null);

    if (!projectTitle.trim()) {
      setError("Enter a project title.");
      return;
    }

    if (!scope.market.trim() || !scope.audience.trim()) {
      setError("Market and audience are required.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/research/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectTitle.trim(), scope })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not create project.");
        return;
      }

      setProjectId(payload.projectId);
      setStep("questions");
    });
  }

  function saveQuestionsAndContinue() {
    setError(null);
    const validQuestions = questions.map((item) => item.trim()).filter(Boolean);

    if (validQuestions.length === 0) {
      setError("Add at least one research question.");
      return;
    }

    if (!projectId) {
      setError("Project not created yet.");
      return;
    }

    startTransition(async () => {
      const saveResponse = await fetch(`/api/research/projects/${projectId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: validQuestions, scope })
      });

      if (!saveResponse.ok) {
        const payload = await saveResponse.json();
        setError(payload.error ?? "Could not save questions.");
        return;
      }

      const adaptiveResponse = await fetch(`/api/research/projects/${projectId}/adaptive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next" })
      });
      const adaptivePayload = await adaptiveResponse.json();

      if (!adaptiveResponse.ok) {
        setError(adaptivePayload.error ?? "Could not start adaptive intake.");
        return;
      }

      setAdaptiveComplete(adaptivePayload.isComplete);
      setAdaptiveQuestion(adaptivePayload.question);
      setCompletionScore(adaptivePayload.completionScore ?? 0);
      setStep("adaptive");
    });
  }

  function submitAdaptiveAnswer() {
    if (!projectId || !adaptiveQuestion || !adaptiveAnswer.trim()) {
      setError("Answer the current question before continuing.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/adaptive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          fieldKey: adaptiveQuestion.fieldKey,
          questionText: adaptiveQuestion.question,
          answerText: adaptiveAnswer.trim()
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not save answer.");
        return;
      }

      setAdaptiveAnswer("");
      setAdaptiveComplete(payload.isComplete);
      setAdaptiveQuestion(payload.question);
      setCompletionScore(payload.completionScore ?? 0);

      if (payload.isComplete) {
        await loadFollowUps();
        setStep("follow_ups");
      }
    });
  }

  async function loadFollowUps() {
    if (!projectId) return;

    const response = await fetch(`/api/research/projects/${projectId}/follow-ups`, {
      method: "POST"
    });
    const payload = await response.json();

    if (response.ok) {
      setFollowUps(payload.suggestions ?? []);
    }
  }

  function skipAdaptiveToFollowUps() {
    startTransition(async () => {
      await loadFollowUps();
      setStep("follow_ups");
    });
  }

  function acceptFollowUp(id: string) {
    setFollowUps((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "accepted" as const } : item))
    );
  }

  function removeAcceptedFollowUp(id: string) {
    setFollowUps((current) => current.filter((item) => item.id !== id));
    setEditingAcceptedId(null);
  }

  function generateMoreFollowUps() {
    if (!projectId) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/follow-ups`, {
        method: "POST"
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not generate follow-ups.");
        return;
      }

      setFollowUps(payload.suggestions ?? []);
    });
  }

  function updateFollowUp(id: string, patch: Partial<FollowUpSuggestion>) {
    setFollowUps((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function saveFollowUpsAndContinue() {
    if (!projectId) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/follow-ups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestions: followUps })
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Could not save follow-ups.");
        return;
      }

      setStep("brief");
      generateBrief();
    });
  }

  function generateBrief() {
    if (!projectId) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/brief`, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Brief generation failed.");
        return;
      }

      setBriefResponse({ brief: payload.brief, source: payload.source });
    });
  }

  const previewPanel =
    step !== "brief" && step !== "follow_ups" ? (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live preview</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{projectTitle || "Untitled project"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {scope.market ? <Badge tone="sky">{scope.market}</Badge> : null}
          {scope.geography ? <Badge tone="slate">{scope.geography}</Badge> : null}
          {scope.audience ? <Badge tone="slate">{scope.audience}</Badge> : null}
        </div>
        {questions.filter(Boolean).length > 0 ? (
          <ul className="mt-4 space-y-2">
            {questions.filter(Boolean).map((item, index) => (
              <li className="surface-muted px-3 py-2 text-sm text-slate-700" key={`pv-${index}`}>
                {index + 1}. {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : undefined;

  return (
    <WizardShell
      steps={STEPS}
      currentStepId={step}
      title={STEPS[stepIndex]?.label ?? "Research"}
      description={STEPS[stepIndex]?.description}
      preview={previewPanel}
    >
      <div className="space-y-6">
          {step === "scope" ? (
            <div className="space-y-5">
              <Field label="Project title">
                <TextInput
                  placeholder="e.g. GenAI coding assistants in enterprise software"
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Industry">
                  <SelectInput
                    value={scope.industry}
                    onChange={(event) => {
                      const industry = industries.find((item) => item.label === event.target.value) ?? industries[0];
                      setScope((current) => ({ ...current, industry: industry.label, industryCode: industry.code }));
                    }}
                  >
                    {industries.map((option) => (
                      <option key={option.code} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Geography">
                  <SelectInput
                    value={scope.geography}
                    onChange={(event) => {
                      const geography = geographies.find((item) => item.label === event.target.value) ?? geographies[0];
                      setScope((current) => ({ ...current, geography: geography.label, geographyCode: geography.code }));
                    }}
                  >
                    {geographies.map((option) => (
                      <option key={option.code} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label={scopeFieldLabels.companySize} hint={scopeFieldLabels.companySizeHelp}>
                  <SelectInput
                    value={scope.companySize}
                    onChange={(event) => setScope((current) => ({ ...current, companySize: event.target.value }))}
                  >
                    {companySizeBands.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Research type">
                  <SelectInput
                    value={scope.researchType}
                    onChange={(event) => setScope((current) => ({ ...current, researchType: event.target.value }))}
                  >
                    {researchTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Decision stakes">
                  <SelectInput
                    value={scope.decisionStakes}
                    onChange={(event) => setScope((current) => ({ ...current, decisionStakes: event.target.value }))}
                  >
                    {decisionStakes.map((stake) => (
                      <option key={stake}>{stake}</option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Market">
                  <TextInput
                    placeholder="e.g. Generative AI coding assistants"
                    value={scope.market}
                    onChange={(event) => setScope((current) => ({ ...current, market: event.target.value }))}
                  />
                </Field>

                <Field label={scopeFieldLabels.audience} hint={scopeFieldLabels.audienceHelp}>
                  <TextInput
                    placeholder="e.g. VP Engineering, DevOps leaders"
                    value={scope.audience}
                    onChange={(event) => setScope((current) => ({ ...current, audience: event.target.value }))}
                  />
                </Field>
              </div>

              <Button className="w-full" size="lg" onClick={continueFromScope} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Continue to questions
              </Button>
            </div>
          ) : null}

          {step === "questions" ? (
            <div className="space-y-5">
              {questions.map((question, index) => (
                <div className="space-y-2" key={`question-${index}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Research question {index + 1}</label>
                    {questions.length > 1 ? (
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => removeQuestion(index)}
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <Textarea
                    placeholder="What business decision are you trying to make?"
                    value={question}
                    onChange={(event) => updateQuestion(index, event.target.value)}
                  />
                </div>
              ))}

              <Button variant="secondary" onClick={addQuestion} disabled={questions.length >= 10}>
                <Plus className="mr-2 h-4 w-4" />
                Add another question
              </Button>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep("scope")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={saveQuestionsAndContinue} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Continue to adaptive intake
                </Button>
              </div>
            </div>
          ) : null}

          {step === "adaptive" ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Intake completeness: <span className="font-semibold text-slate-900">{completionScore}%</span>
              </div>

              {adaptiveComplete ? (
                <p className="text-sm text-slate-600">Adaptive intake is complete. Continue to follow-up suggestions.</p>
              ) : adaptiveQuestion ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{adaptiveQuestion.question}</p>
                    <p className="mt-2 text-sm text-slate-500">{adaptiveQuestion.helper}</p>
                  </div>

                  <Textarea
                    placeholder="Type your answer..."
                    value={adaptiveAnswer}
                    onChange={(event) => setAdaptiveAnswer(event.target.value)}
                  />
                </>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setStep("questions")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {!adaptiveComplete ? (
                  <Button onClick={submitAdaptiveAnswer} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Submit answer
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={skipAdaptiveToFollowUps} disabled={isPending}>
                  Continue to follow-ups
                </Button>
              </div>
            </div>
          ) : null}

          {step === "follow_ups" ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Suggested questions</p>
                    <Button type="button" variant="secondary" size="sm" onClick={generateMoreFollowUps} disabled={isPending}>
                      {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                      Generate more
                    </Button>
                  </div>

                  {pendingFollowUps.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      No pending suggestions. Click &quot;Generate more&quot; for additional follow-up questions.
                    </p>
                  ) : (
                    pendingFollowUps.map((item) => (
                      <div className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                        <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                        <p className="mt-2 text-xs text-slate-500">{item.rationale}</p>
                        <div className="mt-3 flex gap-2">
                          <Button type="button" size="sm" onClick={() => acceptFollowUp(item.id)}>
                            <Check className="mr-1 h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setFollowUps((current) => current.filter((entry) => entry.id !== item.id))
                            }
                          >
                            <X className="mr-1 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Accepted for this project</p>

                  {acceptedFollowUps.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      Accepted questions appear here. You can edit or remove them before continuing.
                    </p>
                  ) : (
                    acceptedFollowUps.map((item) => (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4" key={item.id}>
                        {editingAcceptedId === item.id ? (
                          <Textarea
                            value={item.editedQuestion ?? item.question}
                            onChange={(event) =>
                              updateFollowUp(item.id, {
                                editedQuestion: event.target.value,
                                status: "edited"
                              })
                            }
                          />
                        ) : (
                          <p className="text-sm font-semibold text-slate-900">
                            {item.editedQuestion ?? item.question}
                          </p>
                        )}
                        <div className="mt-3 flex gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-white"
                            onClick={() =>
                              setEditingAcceptedId(editingAcceptedId === item.id ? null : item.id)
                            }
                            aria-label="Edit accepted follow-up"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-red-600 hover:bg-white"
                            onClick={() => removeAcceptedFollowUp(item.id)}
                            aria-label="Delete accepted follow-up"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep("adaptive")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={saveFollowUpsAndContinue} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Continue to brief
                </Button>
              </div>
            </div>
          ) : null}

          {step === "brief" ? (
            <div className="space-y-4">
              {briefResponse ? (
                <BriefReview projectId={projectId!} initialBrief={briefResponse.brief} source={briefResponse.source} />
              ) : (
                <>
                  <p className="text-sm text-slate-600">Generating your structured research brief...</p>
                  <Button className="w-full" onClick={generateBrief} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isPending ? "Generating..." : "Retry brief generation"}
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setStep("follow_ups")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to follow-ups
              </Button>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </WizardShell>
  );
}
