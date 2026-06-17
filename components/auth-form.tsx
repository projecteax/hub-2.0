"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/page-shell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { homePathForRole } from "@/lib/auth/profile";
import { geographies, industries } from "@/lib/standards";

type AccountType = "client" | "expert";

function formatAuthError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  if (error.code) {
    return `Authentication failed (${error.code}).`;
  }

  return "Something went wrong. Please try again.";
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [accountType, setAccountType] = useState<AccountType>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [headline, setHeadline] = useState("");
  const [credentials, setCredentials] = useState("");
  const [seniority, setSeniority] = useState("Director+");
  const [industryCode, setIndustryCode] = useState(industries[0].code);
  const [geographyCode, setGeographyCode] = useState(geographies[0].code);
  const [expertiseTags, setExpertiseTags] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setMessage("Supabase keys are not configured. Add them to .env.local and restart the app.");
        return;
      }

      if (mode === "signin") {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) {
          setMessage(formatAuthError(result.error));
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", result.data.user?.id ?? "")
          .maybeSingle();

        router.push(homePathForRole(profile?.role ?? "client_admin"));
        router.refresh();
        return;
      }

      const metadata =
        accountType === "expert"
          ? {
              account_type: "expert",
              full_name: fullName,
              headline,
              credentials,
              seniority,
              industry_codes: industryCode,
              geography_codes: geographyCode,
              expertise_tags: expertiseTags
            }
          : {
              account_type: "client",
              full_name: fullName,
              company_name: companyName
            };

      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });

      if (result.error) {
        setMessage(formatAuthError(result.error));
        return;
      }

      if (!result.data.session) {
        const signIn = await supabase.auth.signInWithPassword({ email, password });
        if (signIn.error) {
          setMessage(formatAuthError(signIn.error));
          return;
        }
      }

      const userId = result.data.user?.id ?? (await supabase.auth.getUser()).data.user?.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId ?? "")
        .maybeSingle();

      router.push(homePathForRole(profile?.role ?? (accountType === "expert" ? "expert" : "client_admin")));
      router.refresh();
      return;
    });
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md p-6">
      <h2 className="text-xl font-semibold text-slate-950">{mode === "signin" ? "Sign in" : "Create account"}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "signup" ? "Register as a research client or a verifying expert." : "Access your workspace."}
      </p>

      {mode === "signup" ? (
        <Tabs className="mt-5" onValueChange={(v) => setAccountType(v as AccountType)} value={accountType}>
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="client">
              Client
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="expert">
              Expert
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <div className="mt-5 space-y-4">
        {mode === "signup" ? (
          <>
            <Field label="Full name">
              <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </Field>
            {accountType === "client" ? (
              <Field label="Company name">
                <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
              </Field>
            ) : (
              <>
                <Field label="Professional headline">
                  <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="VP Product, Enterprise SaaS" />
                </Field>
                <Field label="Credentials (degrees, certifications)">
                  <TextInput
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                    placeholder="MBA, 15+ years in B2B software"
                  />
                </Field>
                <Field label="Primary industry">
                  <SelectInput value={industryCode} onChange={(e) => setIndustryCode(e.target.value)}>
                    {industries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Primary geography">
                  <SelectInput value={geographyCode} onChange={(e) => setGeographyCode(e.target.value)}>
                    {geographies.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Expertise tags (comma-separated)">
                  <TextInput
                    value={expertiseTags}
                    onChange={(e) => setExpertiseTags(e.target.value)}
                    placeholder="pricing, procurement, security"
                  />
                </Field>
              </>
            )}
          </>
        ) : null}

        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>

        <Button className="w-full" onClick={submit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : accountType === "expert" ? "Create expert account" : "Create client account"}
        </Button>

        {message ? <p className="text-sm text-red-600">{message}</p> : null}

        <button
          className="w-full text-center text-sm font-semibold text-indigo-700"
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
