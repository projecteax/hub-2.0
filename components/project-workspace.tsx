"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { BriefReview } from "@/components/brief-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/input";
import type { DbResearchQuestion } from "@/lib/types";
import type { ResearchBrief, ResearchScope } from "@/lib/types";
import {
  companySizeBands,
  decisionStakes,
  geographies,
  industries,
  researchTypes,
  scopeFieldLabels
} from "@/lib/standards";

type EditableQuestion = {
  text: string;
  source: "client" | "ai_follow_up";
};

type ProjectWorkspaceProps = {
  projectId: string;
  projectTitle: string;
  initialScope: ResearchScope | null;
  initialBrief: ResearchBrief | null;
  initialQuestions: DbResearchQuestion[];
};

export function ProjectWorkspace({
  projectId,
  projectTitle,
  initialScope,
  initialBrief,
  initialQuestions
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [scope, setScope] = useState<ResearchScope>(
    initialScope ?? {
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
    }
  );
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions.length > 0
      ? initialQuestions.map((item) => ({
          text: item.original_question,
          source: item.source === "ai_follow_up" ? "ai_follow_up" : "client"
        }))
      : [{ text: "", source: "client" }]
  );
  const [title, setTitle] = useState(projectTitle);
  const [scopeSaved, setScopeSaved] = useState(false);
  const [questionsSaved, setQuestionsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveScope() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/scope`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, title })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save scope.");
        return;
      }
      setScopeSaved(true);
      router.refresh();
    });
  }

  function saveQuestions() {
    setError(null);
    const valid = questions.map((item) => ({ ...item, text: item.text.trim() })).filter((item) => item.text.length >= 10);
    if (valid.length === 0) {
      setError("Add at least one question with 10 or more characters.");
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/research/projects/${projectId}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: valid, scope })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save questions.");
        return;
      }
      setQuestionsSaved(true);
      router.refresh();
    });
  }

  function updateQuestion(index: number, patch: Partial<EditableQuestion>) {
    setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    setQuestionsSaved(false);
  }

  function addQuestion() {
    if (questions.length >= 20) return;
    setQuestions((current) => [...current, { text: "", source: "client" }]);
    setQuestionsSaved(false);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setQuestionsSaved(false);
  }

  if (!initialBrief) {
    return (
      <div className="glass-card border-dashed p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">No brief yet</p>
        <p className="mt-2 text-sm text-slate-600">Finish the new research wizard to generate a brief for this project.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <Tabs defaultValue="scope">
        <TabsList>
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="scope" className="mt-6 space-y-4">
          <Field label="Project title">
            <TextInput
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setScopeSaved(false);
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <SelectInput
                value={scope.industry}
                onChange={(e) => {
                  const industry = industries.find((item) => item.label === e.target.value) ?? industries[0];
                  setScope((c) => ({ ...c, industry: industry.label, industryCode: industry.code }));
                  setScopeSaved(false);
                }}
              >
                {industries.map((o) => (
                  <option key={o.code} value={o.label}>
                    {o.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Geography">
              <SelectInput
                value={scope.geography}
                onChange={(e) => {
                  const geography = geographies.find((item) => item.label === e.target.value) ?? geographies[0];
                  setScope((c) => ({ ...c, geography: geography.label, geographyCode: geography.code }));
                  setScopeSaved(false);
                }}
              >
                {geographies.map((o) => (
                  <option key={o.code} value={o.label}>
                    {o.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={scopeFieldLabels.companySize} hint={scopeFieldLabels.companySizeHelp}>
              <SelectInput
                value={scope.companySize}
                onChange={(e) => {
                  setScope((c) => ({ ...c, companySize: e.target.value }));
                  setScopeSaved(false);
                }}
              >
                {companySizeBands.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Research type">
              <SelectInput
                value={scope.researchType}
                onChange={(e) => {
                  setScope((c) => ({ ...c, researchType: e.target.value }));
                  setScopeSaved(false);
                }}
              >
                {researchTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Market">
              <TextInput
                value={scope.market}
                onChange={(e) => {
                  setScope((c) => ({ ...c, market: e.target.value }));
                  setScopeSaved(false);
                }}
              />
            </Field>
            <Field label={scopeFieldLabels.audience}>
              <TextInput
                value={scope.audience}
                onChange={(e) => {
                  setScope((c) => ({ ...c, audience: e.target.value }));
                  setScopeSaved(false);
                }}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveScope} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Save scope
            </Button>
            {scopeSaved ? <span className="text-sm text-emerald-700">Saved</span> : null}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">{questions.length} research questions</p>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          {questions.map((question, index) => (
            <div className="surface-muted p-4" key={`pq-${index}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">Question {index + 1}</span>
                <div className="flex items-center gap-2">
                  <Badge tone={question.source === "ai_follow_up" ? "sky" : "slate"}>
                    {question.source === "ai_follow_up" ? "Suggested follow-up" : "Client"}
                  </Badge>
                  {questions.length > 1 ? (
                    <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <Textarea value={question.text} onChange={(e) => updateQuestion(index, { text: e.target.value })} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <Button onClick={saveQuestions} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save questions
            </Button>
            {questionsSaved ? <span className="text-sm text-emerald-700">Saved</span> : null}
          </div>
        </TabsContent>

        <TabsContent value="brief" className="mt-6">
          <BriefReview
            projectId={projectId}
            initialBrief={{ ...initialBrief, title, scope }}
            source="google_ai"
            mode="edit"
            onSaved={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
